import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import ValidationError
from ..schemas import ClientMessage
from ..core.security import verify_token
from ..db.session import get_db
from ..db.room_repository import get_room_by_code, get_room_by_id
from ..db.participant_repository import get_host_participant, get_participant_by_id, mark_participant_left, get_active_participants
from ..db.message_repository import get_messages_for_room
from ..core.storage import (
    manager,
    process_chat_message,
    is_reconnect_expired,
    close_and_delete_room,
    HOST_RECONNECT_GRACE_PERIOD_SECONDS
)

router = APIRouter()

async def build_room_state(db: AsyncSession, db_room) -> dict:
    active = await get_active_participants(db, db_room.id)
    # Pull messages from memory instead of DB
    in_memory_messages = manager.get_messages(db_room.room_code)
    
    return {
        "type": "room_state",
        "room_name": db_room.room_name,
        "locked": db_room.locked,
        "participants": [
            {"participant_id": str(p.id), "nickname": p.nickname} for p in active
        ],
        "messages": in_memory_messages
    }

async def host_grace_timer(room_code: str, disconnected_at: datetime, participant_id: str):
    await asyncio.sleep(HOST_RECONNECT_GRACE_PERIOD_SECONDS)
    
    conn = manager.get_connection(participant_id)
    if conn is None:
        return
        
    current_disconnect = conn.get("disconnected_at")
    if current_disconnect is None:
        return # Reconnected
        
    if current_disconnect != disconnected_at:
        return # New disconnect happened
        
    # Still disconnected, close and delete room
    await close_and_delete_room(room_code)

@router.websocket("/ws/{room_code}")
async def websocket_room(websocket: WebSocket, room_code: str, token: str, db: AsyncSession = Depends(get_db)):
    try:
        db_room = await get_room_by_code(db, room_code)
    except Exception:
        db_room = None
        
    if db_room is None:
        await websocket.accept()
        await websocket.send_text("Room not found")
        await websocket.close()
        return

    room_code = db_room.room_code
    # Is it the host?
    if db_room.host_token_hash and verify_token(token, db_room.host_token_hash):
        host_participant = await get_host_participant(db, db_room.id)
        if not host_participant:
            await websocket.accept()
            await websocket.send_text("Host participant not found in database")
            await websocket.close()
            return
            
        participant_id = str(host_participant.id)
        username = host_participant.nickname
        is_host = True
    else:
        # Not host, verify participant ws_token
        participant_id = manager.get_participant_id_by_token(token)
        if not participant_id:
            await websocket.accept()
            await websocket.send_text("Invalid WebSocket token")
            await websocket.close()
            return
            
        db_participant = await get_participant_by_id(db, participant_id)
        if not db_participant or db_participant.left_at is not None:
            await websocket.accept()
            await websocket.send_text("Participant is no longer in the room")
            await websocket.close()
            return
            
        username = db_participant.nickname
        is_host = False

    # Check reconnect logic
    conn = manager.get_connection(participant_id)
    if conn and conn.get("disconnected_at"):
        if is_reconnect_expired(conn["disconnected_at"]):
            await websocket.accept()
            await websocket.send_text("Reconnect window expired. Please join again.")
            await websocket.close()
            # Clean up db state
            await mark_participant_left(db, participant_id)
            manager.remove_connection(participant_id)
            return

    # Accept connection and update runtime manager
    await websocket.accept()
    manager.register_connection(participant_id, room_code, websocket)
    
    # Send current state
    room_state = await build_room_state(db, db_room)
    await websocket.send_json(room_state)

    # Broadcast arrival
    if conn and conn.get("disconnected_at"):
        if is_host:
            from ..db.room_repository import update_room_status
            await update_room_status(db, room_code, 'active')
            await manager.broadcast_to_room(
                room_code,
                {"type": "host_reconnected"},
                exclude_participant_id=participant_id
            )
        else:
            await manager.broadcast_to_room(
                room_code,
                {"type": "participant_reconnected", "participant_id": participant_id, "nickname": username},
                exclude_participant_id=participant_id
            )
    else:
        await manager.broadcast_to_room(
            room_code,
            {"type": "participant_joined", "participant_id": participant_id, "nickname": username},
            exclude_participant_id=participant_id
        )

        from pydantic import TypeAdapter
        from ..schemas import ClientMessage
        message_adapter = TypeAdapter(ClientMessage)
        try:
            while True:
                data = await websocket.receive_text()
                try:
                    incoming = message_adapter.validate_json(data)
                    if incoming.type == "chat_message":
                        chat_content = incoming.get_content()
                        if chat_content:
                            await process_chat_message(
                                participant_db_id=participant_id,
                                username=username,
                                content=chat_content,
                                room_code=room_code
                            )
                    elif incoming.type == "edit_message":
                        msg_id, edit_content = incoming.get_data()
                        if msg_id and edit_content:
                            if manager.edit_message(room_code, msg_id, edit_content):
                                await manager.broadcast_to_room(room_code, {
                                    "type": "message_edited",
                                    "message_id": msg_id,
                                    "content": edit_content
                                })
                    elif incoming.type == "delete_message":
                        del_msg_id = incoming.get_message_id()
                        if del_msg_id and manager.delete_message(room_code, del_msg_id):
                            await manager.broadcast_to_room(room_code, {
                                "type": "message_deleted",
                                "message_id": del_msg_id
                            })
                    elif incoming.type == "presence_ping":
                        await websocket.send_json({"type": "presence_pong"})
                except ValidationError:
                    await websocket.send_text("Invalid message format")
        except WebSocketDisconnect:
            manager.mark_disconnected(participant_id)
            disconnect_time = manager.get_connection(participant_id)["disconnected_at"]
            
            if is_host:
                # Start host grace timer
                from ..db.room_repository import update_room_status
                from ..db.session import AsyncSessionLocal
                async with AsyncSessionLocal() as db_session:
                    await update_room_status(db_session, room_code, 'host_grace')
                    
                task = asyncio.create_task(host_grace_timer(room_code, disconnect_time, participant_id))
                manager.get_connection(participant_id)["reconnect_task"] = task
                
                from datetime import timedelta
                grace_expires_at = disconnect_time + timedelta(seconds=HOST_RECONNECT_GRACE_PERIOD_SECONDS)
                
                await manager.broadcast_to_room(room_code, {
                    "type": "host_disconnected_grace_started",
                    "grace_expires_at": grace_expires_at.isoformat()
                })
            else:
                await manager.broadcast_to_room(
                    room_code,
                    {"type": "participant_left", "participant_id": participant_id},
                    exclude_participant_id=participant_id
                )