from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.models.room import Room
from app.db.room_repository import get_room_by_id
from app.core.storage import manager

async def close_room(db: AsyncSession, room_id: str, save: bool = False, reason: str = "host_ended"):
    db_room = await get_room_by_id(db, room_id)
    if not db_room:
        return
        
    if save:
        if not db_room.owner_user_id:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="guest_rooms_cannot_be_saved")
            
        # Update room status to archived
        db_room.status = "archived"
        db_room.is_saved = True
        db_room.archived_at = text("now()")
        
        # Save messages from memory
        from app.db.message_repository import save_messages_for_room
        msgs = manager.get_messages(db_room.room_code)
        if msgs:
            await save_messages_for_room(db, db_room.id, msgs)

        # Delete participants
        await db.execute(text("DELETE FROM participants WHERE room_id = :room_id"), {"room_id": db_room.id})
        await db.commit()
    else:
        # Cascade delete (drops messages and participants too)
        await db.delete(db_room)
        await db.commit()
        
    # Broadcast 'room_closing' and disconnect everyone
    await manager.broadcast_to_room(db_room.room_code, {"type": "room_closing", "reason": reason})
    await manager.close_room(db_room.room_code)
