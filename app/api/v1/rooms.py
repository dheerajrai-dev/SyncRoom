from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from ..deps import verify_host_token, get_optional_current_user
from ...db.participant_repository import get_active_participants
from ...db.room_repository import get_room_by_code
from ...db.message_repository import get_messages_for_room
from ...db.session import get_db
from ...schemas import (
    ApproveRequest,
    DeniedRequest,
    JoinRequest,
    JoinResponse,
    RoomInfo,
    Room_Code,
    CloseRoomRequest,
    CreateRoomRequest,
    RoomUpdateRequest,
)
from ...core.storage import manager
from ...core.rate_limiter import limiter
from ...services.room_service import (
    create_new_room,
    request_to_join_room,
    approve_participant_join,
    deny_participant_join,
    kick_participant_from_room,
    update_room_details,
    close_room,
)

router = APIRouter()


@router.post("/rooms", response_model=Room_Code, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
async def create_room(
    request: Request,
    body: CreateRoomRequest | None = None,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_optional_current_user),
):
    room_name = body.room_name if body else None
    owner_user_id = user.id if user else None

    db_room, host_token_value = await create_new_room(db, room_name, owner_user_id)

    return Room_Code(
        room_id=str(db_room.id),
        code=db_room.room_code,
        host_token=host_token_value,
        owner=user is not None,
        ttl_expires_at=db_room.ttl_expires_at.isoformat() if db_room.ttl_expires_at else "",
    )


@router.get("/rooms/{room_code}", response_model=RoomInfo)
async def get_room(room_code: str, db: AsyncSession = Depends(get_db)):
    db_room = await get_room_by_code(db, room_code)
    if db_room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    return RoomInfo(
        room_id=str(db_room.id),
        code=db_room.room_code,
        name=db_room.room_name,
        locked=db_room.locked,
    )


@router.post("/rooms/{room_code}/end")
async def end_room(
    room_code: str,
    close_request: CloseRoomRequest,
    db: AsyncSession = Depends(get_db),
    db_room = Depends(verify_host_token),
):
    try:
        await close_room(db, str(db_room.id), save=close_request.save)
    except HTTPException:
        raise
    except Exception as e:
        if getattr(e, "detail", "") == "guest_rooms_cannot_be_saved":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="guest_rooms_cannot_be_saved")
        raise

    if close_request.save:
        return JSONResponse({"status": "archived", "room_id": str(db_room.id)})
    return JSONResponse({"status": "deleted"})


@router.post("/rooms/{room_code}/join", response_model=JoinResponse, status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("40/minute")
async def join_room(
    request: Request,
    room_code: str,
    join_request: JoinRequest,
    db: AsyncSession = Depends(get_db),
):
    req_id = await request_to_join_room(db, room_code, join_request.nickname)
    return JoinResponse(participant_id=req_id, pending=True)


@router.get("/rooms/{room_code}/participants")
async def get_participants(
    room_code: str,
    db: AsyncSession = Depends(get_db),
    db_room = Depends(verify_host_token),
):
    result = []

    active = await get_active_participants(db, db_room.id)
    for p in active:
        result.append({"id": str(p.id), "nickname": p.nickname, "status": "approved"})

    pending = manager.get_all_pending(room_code)
    for req_id, data in pending.items():
        if isinstance(data, str):
            result.append({"id": req_id, "nickname": data, "status": "pending"})

    return {"participants": result}


@router.post("/rooms/{room_code}/approve")
async def approve_participant(
    room_code: str,
    approve_request: ApproveRequest,
    db: AsyncSession = Depends(get_db),
    db_room = Depends(verify_host_token),
):
    participant_id, new_ws_token = await approve_participant_join(
        db, db_room, approve_request.participant_id
    )
    return {
        "message": "Participant approved successfully",
        "participant_id": participant_id,
        "ws_token": new_ws_token,
    }


@router.post("/rooms/{room_code}/deny")
async def denied_participant(
    room_code: str,
    denied_request: DeniedRequest,
    db_room = Depends(verify_host_token),
):
    await deny_participant_join(room_code, denied_request.participant_id)
    return {
        "message": "Participant denied successfully",
        "participant_id": denied_request.participant_id,
    }


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
async def get_messages(
    room_code: str,
    db: AsyncSession = Depends(get_db),
    db_room = Depends(verify_host_token),
):
    db_messages = await get_messages_for_room(db, db_room.id)
    return {
        "messages": [
            {"nickname": m.nickname, "content": m.content, "sent_at": m.sent_at.isoformat()}
            for m in db_messages
        ]
    }


@router.post("/rooms/{room_code}/kick")
async def kick_participant(
    room_code: str,
    kick_request: DeniedRequest,
    db: AsyncSession = Depends(get_db),
    db_room = Depends(verify_host_token),
):
    await kick_participant_from_room(db, db_room, kick_request.participant_id)
    return {"message": "Participant kicked successfully"}


@router.patch("/rooms/{room_code}")
async def update_room(
    room_code: str,
    update_request: RoomUpdateRequest,
    db: AsyncSession = Depends(get_db),
    db_room = Depends(verify_host_token),
):
    await update_room_details(
        db,
        db_room,
        room_name=update_request.room_name,
        locked=update_request.locked,
    )
    return {"message": "Room updated successfully"}