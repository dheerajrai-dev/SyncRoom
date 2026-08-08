from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import JSONResponse, PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from ..dependencies import verify_host_token
from ..db.participant_repository import create_participant_row, mark_participant_left
from ..db.room_repository import create_room_row, get_room_by_code, update_room_locked, update_room_name
from ..db.message_repository import get_messages_for_room
from ..db.session import get_db
from ..schemas import ApproveRequest, DeniedRequest, JoinRequest, JoinResponse, RoomInfo, Room_Code, RoomName, DeleteRoomRequest
from ..security import hash_token
from ..storage import MAX_PARTICIPANTS, broadcast_message, close_and_delete_room, generate_code, host_token , participant_id, rooms, ws_token, gather_export_data

router = APIRouter()

# Create a new room and return its code + host token
@router.post("/rooms", response_model=Room_Code, status_code=status.HTTP_201_CREATED)
async def create_room(db: AsyncSession = Depends(get_db)):
    host_token_value = host_token()
    host_token_hash = hash_token(host_token_value)
    for _ in range(5):
        room_code = generate_code()
        if await create_room_row(db, room_code, host_token_hash):
            break
    else:
        raise HTTPException(status_code=500, detail="Could not generate a unique room code, please try again")

    db_room = await get_room_by_code(db, room_code)
    db_host_participant = await create_participant_row(db, db_room.id, "Host", role="host")

    rooms[room_code] = {
                         "db_id": db_room.id,
                         "participants": {},
                         "created_at": datetime.now(timezone.utc),
                         "host_connection": {
                             "host_id": "Host",
                             "websocket": None,
                            "disconnected_at": None,
                             "db_id": db_host_participant.id,
                         }}
    return Room_Code(code=room_code, host_token=host_token_value)

# Get room details by room code
@router.get("/rooms/{room_code}", response_model=RoomInfo)
async def get_room(room_code: str, db: AsyncSession = Depends(get_db)):
    db_room = await get_room_by_code(db, room_code)
    if db_room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    return RoomInfo(code=db_room.room_code, name=db_room.name, locked=db_room.locked)

# Delete a room after host token verification
@router.delete("/rooms/{room_code}")
async def delete_room(
    room_code: str, 
    delete_request: DeleteRoomRequest | None = None,
    db: AsyncSession = Depends(get_db), 
    room: dict = Depends(verify_host_token)
):
    db_room = await get_room_by_code(db, room_code)
    room_name = db_room.name if db_room else None
    
    export_data = None
    if delete_request and delete_request.export:
        db_messages = await get_messages_for_room(db, db_room.id) if db_room else []
        export_data = gather_export_data(room_code, room, room_name, db_messages)

    await close_and_delete_room(room_code)
    
    if export_data:
        if delete_request.format == "txt":
            lines = [f"Room: {export_data['room_name']}", "Participants: " + ", ".join(export_data['participants']), ""]
            for m in export_data['messages']:
                lines.append(f"[{m['time']}] {m['username']}: {m['content']}")
            return PlainTextResponse("\n".join(lines))
        return JSONResponse(export_data)

    return Response(status_code=status.HTTP_204_NO_CONTENT)


# Participant requests to join a room
@router.post("/rooms/{room_code}/join", response_model=JoinResponse, status_code=status.HTTP_202_ACCEPTED)
async def join_room(room_code: str, join_request: JoinRequest, db: AsyncSession = Depends(get_db)):
    room = rooms.get(room_code)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    db_room = await get_room_by_code(db, room_code)
    if db_room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    if db_room.locked:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Room is locked to new participants")

    active_participants = sum(
        1 for participant in room["participants"].values()
        if participant["status"] in ("pending", "approved")
    )

    if active_participants >= MAX_PARTICIPANTS:
        raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Room is full"
    )

    pid = participant_id()
    room["participants"][pid] = {
        "participant_id": pid,
        "username": join_request.username,
        "status": "pending",
        "ws_token": None,
        "websocket": None,
        "disconnected_at": None
    }
    return JoinResponse(participant_id=pid, pending=True)

# Host gets list of all participants
@router.get("/rooms/{room_code}/participants")
def get_participants(room_code: str, room: dict = Depends(verify_host_token)):
    result = []
    for pid, pdata in room["participants"].items():
        result.append(
            {"id": pid, "username": pdata["username"], "status": pdata["status"]}
        )
    return {"participants": result}

# Host approves a participant and assigns websocket token
@router.post("/rooms/{room_code}/approve")
async def approve_participant(room_code: str, approve_request: ApproveRequest, db: AsyncSession = Depends(get_db), room: dict = Depends(verify_host_token)):
    participant = room["participants"].get(approve_request.participant_id)
    if participant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

    participant["status"] = "approved"
    participant["ws_token"] = ws_token()

    db_room = await get_room_by_code(db, room_code)
    db_participant = await create_participant_row(db, db_room.id, participant["username"])
    participant["db_id"] = db_participant.id

    return {
        "message": "Participant approved successfully",
        "participant_id": approve_request.participant_id,
        "ws_token": participant["ws_token"],
    }

# Host denies a participant request
@router.post("/rooms/{room_code}/deny")
def denied_participant(room_code: str, denied_request: DeniedRequest, room: dict = Depends(verify_host_token)):
    participant = room["participants"].get(denied_request.participant_id)
    if participant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

    participant["status"] = "denied"
    return {"message": "Participant denied successfully", "participant_id": denied_request.participant_id}

# Participant checks whether join request is approved or denied
@router.get("/rooms/{room_code}/join/{participant_id}/status")
def check_join_status(room_code: str, participant_id: str):
    room = rooms.get(room_code)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    participant = room["participants"].get(participant_id)
    if participant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

    response = {"status": participant["status"]}
    if participant["status"] == "approved":
        response["ws_token"] = participant["ws_token"]
    return response

# Host gets all stored messages in the room
@router.get("/rooms/{room_code}/messages")
async def get_messages(room_code: str, db: AsyncSession = Depends(get_db), room: dict = Depends(verify_host_token)):
    db_room = await get_room_by_code(db, room_code)
    db_messages = await get_messages_for_room(db, db_room.id)
    return {
        "messages": [
            {"username": m.nickname, "content": m.content, "sent_at": m.sent_at.isoformat()}
            for m in db_messages
        ]
    }


# host kicks a participant from the room
@router.post("/rooms/{room_code}/kick")
async def kick_participant(room_code: str, kick_request: DeniedRequest, db: AsyncSession = Depends(get_db), room: dict = Depends(verify_host_token)):
    participant = room["participants"].get(kick_request.participant_id)
    if participant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

    # If they're currently connected, notify and close the socket first
    if participant["websocket"] is not None:
        await participant["websocket"].send_text("You have been kicked from the room")
        await participant["websocket"].close()

        # Broadcast message to all connected participants
        await broadcast_message(
                    {
                        "type": "participant_kicked",
                        "username": participant["username"]
                    },
                    room,
                    exclude_participant_id=participant["participant_id"]
            )

    if participant.get("db_id"):
        await mark_participant_left(db, participant["db_id"])

    participant["websocket"] = None
    participant["disconnected_at"] = None
    participant["ws_token"] = None
    participant["status"] = "kicked"
    return {"message": f"{participant['username']} kicked successfully"}

# locked the room for new participants
@router.post("/rooms/{room_code}/lock")
async def lock_room(room_code: str, db: AsyncSession = Depends(get_db), room: dict = Depends(verify_host_token)):
    await update_room_locked(db, room_code, True)
    return {"message": "Room locked successfully"}

# unlocked the room for new participants
@router.post("/rooms/{room_code}/unlock")
async def unlock_room(room_code: str, db: AsyncSession = Depends(get_db), room: dict = Depends(verify_host_token)):
    await update_room_locked(db, room_code, False)
    return {"message": "Room unlocked successfully"}

# Set the name of the room
@router.patch("/rooms/{room_code}/rename")
async def set_room_name(room_code: str, room_name: RoomName, db: AsyncSession = Depends(get_db), room: dict = Depends(verify_host_token)):
    await update_room_name(db, room_code, room_name.name)
    await broadcast_message(
        {
            "type": "room_name_updated",
            "name": room_name.name
        },
        room
    )
    return