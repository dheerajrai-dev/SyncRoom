from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import JSONResponse, PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from ..deps import verify_host_token, get_optional_current_user
from ...db.participant_repository import create_participant_row, mark_participant_left, get_active_participants
from ...db.room_repository import create_room_row, get_room_by_code, update_room_locked, update_room_name
from ...db.message_repository import get_messages_for_room
from ...db.session import get_db
from ...schemas import ApproveRequest, DeniedRequest, JoinRequest, JoinResponse, RoomInfo, Room_Code, RoomName, CloseRoomRequest, CreateRoomRequest, RoomUpdateRequest
from ...core.security import hash_token
from ...core.storage import MAX_PARTICIPANTS, generate_code, host_token, participant_id, ws_token, manager
from ...services.room_service import close_room

router = APIRouter()

@router.post("/rooms", response_model=Room_Code, status_code=status.HTTP_201_CREATED)
async def create_room(
    request: CreateRoomRequest | None = None,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_optional_current_user)
):
    host_token_value = host_token()
    host_token_hash = hash_token(host_token_value)
    
    room_name = request.room_name if request else None
    owner_user_id = user.id if user else None
    
    for _ in range(5):
        room_code = generate_code()
        if await create_room_row(db, room_code, host_token_hash, owner_user_id, room_name):
            break
    else:
        raise HTTPException(status_code=500, detail="Could not generate a unique room code, please try again")

    db_room = await get_room_by_code(db, room_code)
    await create_participant_row(db, db_room.id, "Host", role="host")
    
    return Room_Code(
        room_id=str(db_room.id), 
        code=room_code, 
        host_token=host_token_value,
        owner=user is not None,
        ttl_expires_at=db_room.ttl_expires_at.isoformat() if db_room.ttl_expires_at else ""
    )

@router.get("/rooms/{room_code}", response_model=RoomInfo)
async def get_room(room_code: str, db: AsyncSession = Depends(get_db)):
    db_room = await get_room_by_code(db, room_code)
    if db_room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    return RoomInfo(room_id=str(db_room.id), code=db_room.room_code, name=db_room.room_name, locked=db_room.locked)

@router.post("/rooms/{room_code}/end")
async def end_room(
    room_code: str, 
    close_request: CloseRoomRequest,
    db: AsyncSession = Depends(get_db), 
    db_room = Depends(verify_host_token)
):
    try:
        await close_room(db, str(db_room.id), save=close_request.save)
    except Exception as e:
        if str(e) == "403: guest_rooms_cannot_be_saved" or getattr(e, "detail", "") == "guest_rooms_cannot_be_saved":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="guest_rooms_cannot_be_saved")
        raise
        
    if close_request.save:
        return JSONResponse({"status": "archived", "room_id": str(db_room.id)})
    return JSONResponse({"status": "deleted"})

@router.post("/rooms/{room_code}/join", response_model=JoinResponse, status_code=status.HTTP_202_ACCEPTED)
async def join_room(room_code: str, join_request: JoinRequest, db: AsyncSession = Depends(get_db)):
    db_room = await get_room_by_code(db, room_code)
    if db_room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    if db_room.locked:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Room is locked to new participants")

    active_participants = await get_active_participants(db, db_room.id)
    pending = manager.get_all_pending(room_code)
    
    if len(active_participants) + len(pending) >= MAX_PARTICIPANTS:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Room is full")

    req_id = participant_id()
    manager.add_pending_request(room_code, req_id, join_request.nickname)
    
    await manager.broadcast_to_room(room_code, {
        "type": "join_request",
        "participant_id": req_id,
        "nickname": join_request.nickname
    })
    
    return JoinResponse(participant_id=req_id, pending=True)

@router.get("/rooms/{room_code}/participants")
async def get_participants(room_code: str, db: AsyncSession = Depends(get_db), db_room = Depends(verify_host_token)):
    result = []
    
    active = await get_active_participants(db, db_room.id)
    for p in active:
        result.append(
            {"id": str(p.id), "nickname": p.nickname, "status": "approved"}
        )
        
    pending = manager.get_all_pending(room_code)
    for req_id, data in pending.items():
        if isinstance(data, str):
            result.append({"id": req_id, "nickname": data, "status": "pending"})
        
    return {"participants": result}

@router.post("/rooms/{room_code}/approve")
async def approve_participant(room_code: str, approve_request: ApproveRequest, db: AsyncSession = Depends(get_db), db_room = Depends(verify_host_token)):
    username = manager.get_pending_request(room_code, approve_request.participant_id)
    if not username or not isinstance(username, str):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")
        
    db_participant = await create_participant_row(db, db_room.id, username, role="participant")
    
    new_ws_token = ws_token()
    manager.pre_register_connection(str(db_participant.id), room_code, new_ws_token)
    
    manager.pending_requests[room_code.upper()][approve_request.participant_id] = {
        "status": "approved",
        "ws_token": new_ws_token,
        "real_id": str(db_participant.id)
    }

    # Immediately broadcast to host that participant is approved, removing from pending
    await manager.broadcast_to_room(room_code, {
        "type": "participant_approved",
        "participant_id": approve_request.participant_id
    })

    return {
        "message": "Participant approved successfully",
        "participant_id": str(db_participant.id),
        "ws_token": new_ws_token,
    }

@router.post("/rooms/{room_code}/deny")
async def denied_participant(room_code: str, denied_request: DeniedRequest, db_room = Depends(verify_host_token)):
    req = manager.get_pending_request(room_code, denied_request.participant_id)
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")
        
    manager.pending_requests[room_code.upper()][denied_request.participant_id] = {"status": "denied"}
    
    # Broadcast to room to immediately update host UI
    await manager.broadcast_to_room(room_code, {
        "type": "participant_denied",
        "participant_id": denied_request.participant_id
    })
    
    return {"message": "Participant denied successfully", "participant_id": denied_request.participant_id}

@router.get("/rooms/{room_code}/join/{participant_id}/status")
def check_join_status(room_code: str, participant_id: str):
    pending = manager.get_all_pending(room_code)
    req = pending.get(participant_id)
    
    if req is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")
        
    if isinstance(req, str):
        return {"status": "pending"}
    
    if isinstance(req, dict):
        if req["status"] == "approved":
            return {"status": "approved", "ws_token": req["ws_token"]}
        elif req["status"] == "denied":
            return {"status": "denied"}
            
    return {"status": "pending"}

@router.get("/rooms/{room_code}/messages")
async def get_messages(room_code: str, db: AsyncSession = Depends(get_db), db_room = Depends(verify_host_token)):
    db_messages = await get_messages_for_room(db, db_room.id)
    return {
        "messages": [
            {"nickname": m.nickname, "content": m.content, "sent_at": m.sent_at.isoformat()}
            for m in db_messages
        ]
    }

@router.post("/rooms/{room_code}/kick")
async def kick_participant(room_code: str, kick_request: DeniedRequest, db: AsyncSession = Depends(get_db), db_room = Depends(verify_host_token)):
    if db_room.status == "host_grace":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="host_disconnected_actions_frozen")
    await mark_participant_left(db, kick_request.participant_id)
    
    conn = manager.get_connection(kick_request.participant_id)
    if conn and conn["websocket"]:
        try:
            await conn["websocket"].send_json({"type": "room_deleted", "message": "You have been kicked from the room"})
            await conn["websocket"].close()
        except Exception:
            pass
        
    await manager.broadcast_to_room(
        room_code, 
        {"type": "participant_kicked", "participant_id": kick_request.participant_id, "nickname": "Participant"}, 
        exclude_participant_id=kick_request.participant_id
    )

    manager.remove_connection(kick_request.participant_id)
    return {"message": "Participant kicked successfully"}

@router.patch("/rooms/{room_code}")
async def update_room(
    room_code: str, 
    update_request: RoomUpdateRequest, 
    db: AsyncSession = Depends(get_db), 
    db_room = Depends(verify_host_token)
):
    if db_room.status == "host_grace":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="host_disconnected_actions_frozen")
        
    ws_event = {"type": "room_updated"}
    
    if update_request.room_name is not None:
        await update_room_name(db, room_code, update_request.room_name)
        ws_event["room_name"] = update_request.room_name
        
    if update_request.locked is not None:
        await update_room_locked(db, room_code, update_request.locked)
        ws_event["locked"] = update_request.locked
        
    # Only broadcast if there was actually an update
    if len(ws_event) > 1:
        await manager.broadcast_to_room(room_code, ws_event)
        
    return {"message": "Room updated successfully"}