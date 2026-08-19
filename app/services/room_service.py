import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from fastapi import HTTPException, status

from app.models.room import Room
from app.db.room_repository import (
    create_room_row,
    get_room_by_code,
    get_room_by_id,
    update_room_locked,
    update_room_name,
)
from app.db.participant_repository import (
    create_participant_row,
    get_participant_by_id,
    mark_participant_left,
    get_active_participants,
)
from app.core.security import hash_token
from app.core.storage import (
    MAX_PARTICIPANTS,
    generate_code,
    host_token,
    participant_id,
    ws_token,
    manager,
)


async def create_new_room(
    db: AsyncSession,
    room_name: str | None = None,
    owner_user_id: uuid.UUID | str | None = None,
) -> tuple[Room, str]:
    host_token_value = host_token()
    host_token_hash = hash_token(host_token_value)

    for _ in range(5):
        room_code = generate_code()
        if await create_room_row(db, room_code, host_token_hash, owner_user_id, room_name):
            break
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate a unique room code, please try again",
        )

    db_room = await get_room_by_code(db, room_code)
    if not db_room:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initialize room in database",
        )

    await create_participant_row(db, db_room.id, "Host", role="host")
    return db_room, host_token_value


async def request_to_join_room(
    db: AsyncSession,
    room_code: str,
    nickname: str,
) -> str:
    db_room = await get_room_by_code(db, room_code)
    if db_room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    if db_room.locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Room is locked to new participants",
        )

    active_participants = await get_active_participants(db, db_room.id)
    pending = manager.get_all_pending(room_code)

    if len(active_participants) + len(pending) >= MAX_PARTICIPANTS:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Room is full")

    req_id = participant_id()
    manager.add_pending_request(room_code, req_id, nickname)

    await manager.broadcast_to_room(
        room_code,
        {
            "type": "join_request",
            "participant_id": req_id,
            "nickname": nickname,
        },
    )
    return req_id


async def approve_participant_join(
    db: AsyncSession,
    db_room: Room,
    participant_id_req: str,
) -> tuple[str, str]:
    username = manager.get_pending_request(db_room.room_code, participant_id_req)
    if not username or not isinstance(username, str):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

    db_participant = await create_participant_row(db, db_room.id, username, role="participant")

    new_ws_token = ws_token()
    manager.pre_register_connection(str(db_participant.id), db_room.room_code, new_ws_token)

    manager.pending_requests[db_room.room_code.upper()][participant_id_req] = {
        "status": "approved",
        "ws_token": new_ws_token,
        "real_id": str(db_participant.id),
    }

    # Immediately broadcast to host/participants that join request was approved
    await manager.broadcast_to_room(
        db_room.room_code,
        {
            "type": "participant_approved",
            "participant_id": participant_id_req,
        },
    )

    return str(db_participant.id), new_ws_token


async def deny_participant_join(
    room_code: str,
    participant_id_req: str,
) -> None:
    req = manager.get_pending_request(room_code, participant_id_req)
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

    manager.pending_requests[room_code.upper()][participant_id_req] = {"status": "denied"}

    await manager.broadcast_to_room(
        room_code,
        {
            "type": "participant_denied",
            "participant_id": participant_id_req,
        },
    )


async def kick_participant_from_room(
    db: AsyncSession,
    db_room: Room,
    participant_id_to_kick: str,
) -> None:
    if db_room.status == "host_grace":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="host_disconnected_actions_frozen",
        )

    # Fetch participant to get their actual nickname before marking as left
    db_participant = await get_participant_by_id(db, participant_id_to_kick)
    kicked_nickname = db_participant.nickname if db_participant else "Participant"

    await mark_participant_left(db, participant_id_to_kick)

    conn = manager.get_connection(participant_id_to_kick)
    if conn and conn.get("websocket"):
        try:
            await conn["websocket"].send_json(
                {"type": "room_deleted", "message": "You have been kicked from the room"}
            )
            await conn["websocket"].close()
        except Exception:
            pass

    await manager.broadcast_to_room(
        db_room.room_code,
        {
            "type": "participant_kicked",
            "participant_id": participant_id_to_kick,
            "nickname": kicked_nickname,
        },
        exclude_participant_id=participant_id_to_kick,
    )

    manager.remove_connection(participant_id_to_kick)


async def update_room_details(
    db: AsyncSession,
    db_room: Room,
    room_name: str | None = None,
    locked: bool | None = None,
) -> None:
    if db_room.status == "host_grace":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="host_disconnected_actions_frozen",
        )

    ws_event: dict = {"type": "room_updated"}

    if room_name is not None:
        await update_room_name(db, db_room.room_code, room_name)
        ws_event["room_name"] = room_name

    if locked is not None:
        await update_room_locked(db, db_room.room_code, locked)
        ws_event["locked"] = locked

    if len(ws_event) > 1:
        await manager.broadcast_to_room(db_room.room_code, ws_event)


async def close_room(
    db: AsyncSession,
    room_id: str,
    save: bool = False,
    reason: str = "host_ended",
) -> None:
    db_room = await get_room_by_id(db, room_id)
    if not db_room:
        return

    if save:
        if not db_room.owner_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="guest_rooms_cannot_be_saved",
            )

        db_room.status = "archived"
        db_room.is_saved = True
        db_room.archived_at = text("now()")

        from app.db.message_repository import save_messages_for_room

        msgs = manager.get_messages(db_room.room_code)
        if msgs:
            await save_messages_for_room(db, db_room.id, msgs)

        await db.execute(
            text("DELETE FROM participants WHERE room_id = :room_id"),
            {"room_id": db_room.id},
        )
        await db.commit()
    else:
        await db.delete(db_room)
        await db.commit()

    await manager.broadcast_to_room(
        db_room.room_code,
        {"type": "room_closing", "reason": reason},
    )
    await manager.close_room(db_room.room_code)
