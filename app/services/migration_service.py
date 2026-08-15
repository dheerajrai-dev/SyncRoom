from sqlalchemy.ext.asyncio import AsyncSession
from app.db.room_repository import get_room_by_code
from app.db.participant_repository import get_active_participants
from app.core.storage import manager, host_token
from app.core.security import hash_token

async def perform_host_migration(db: AsyncSession, room_code: str):
    db_room = await get_room_by_code(db, room_code)
    if not db_room:
        return
        
    # Demote old host FIRST if they exist
    from app.db.participant_repository import get_host_participant
    old_host = await get_host_participant(db, db_room.id)
    if old_host:
        from datetime import datetime, timezone
        old_host.left_at = datetime.now(timezone.utc)
        await db.flush()
        
    active_participants = await get_active_participants(db, db_room.id)
    if not active_participants:
        # No one left, close room
        from app.services.room_service import close_room
        await close_room(db, str(db_room.id), save=False, reason="host_disconnect_grace_expired_and_room_empty")
        return
        
    # Promote the oldest participant to host (ordered by joined_at)
    new_host = active_participants[0]
    
    # Generate new host credentials
    new_host_token = host_token()
    new_host_token_hash = hash_token(new_host_token)
    
    # Update room with new host and status
    db_room.host_token_hash = new_host_token_hash
    db_room.status = "active"
        
    # Promote new host
    new_host.role = "host"
    new_host.nickname = "Host" # or keep their name? Usually host is just "Host"
    
    await db.commit()
    
    new_host_pid = str(new_host.id)
    
    # Broadcast host_migrated to everyone
    await manager.broadcast_to_room(room_code, {
        "type": "host_migrated",
        "new_host_id": new_host_pid,
        "new_host_name": new_host.nickname
    })
    
    # Send credentials ONLY to the new host
    new_host_conn = manager.get_connection(new_host_pid)
    print(f"DEBUG MIGRATION: new_host_pid={new_host_pid}, conn_exists={new_host_conn is not None}", flush=True)
    if new_host_conn and new_host_conn.get("websocket"):
        try:
            print(f"DEBUG MIGRATION: Attempting to send credentials to new host", flush=True)
            await new_host_conn["websocket"].send_json({
                "type": "host_credentials",
                "host_token": new_host_token
            })
            print(f"DEBUG MIGRATION: Sent credentials successfully", flush=True)
        except Exception as e:
            print(f"DEBUG MIGRATION: Failed to send credentials: {e}", flush=True)
    else:
        print(f"DEBUG MIGRATION: new_host_conn is None or websocket is missing. active_conns keys: {list(manager.active_connections.keys())}", flush=True)
