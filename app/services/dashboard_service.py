from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.models.room import Room
from app.models.message import Message
import uuid

async def get_archived_rooms(db: AsyncSession, user_id: str | uuid.UUID, limit: int = 10, offset: int = 0, query: str = None):
    stmt = select(Room).where(Room.owner_user_id == user_id, Room.status == 'archived')
    
    if query:
        stmt = stmt.where(Room.room_name.ilike(f"%{query}%"))
        
    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = await db.scalar(count_stmt)
    
    # Get paginated
    stmt = stmt.order_by(desc(Room.archived_at)).limit(limit).offset(offset)
    result = await db.execute(stmt)
    rooms = result.scalars().all()
    
    # Get message counts
    room_ids = [room.id for room in rooms]
    message_counts = {}
    if room_ids:
        mc_stmt = select(Message.room_id, func.count(Message.id)).where(Message.room_id.in_(room_ids)).group_by(Message.room_id)
        mc_result = await db.execute(mc_stmt)
        message_counts = {row[0]: row[1] for row in mc_result.all()}
        
    return {
        "rooms": [
            {
                "id": str(r.id),
                "room_name": r.room_name,
                "room_code": r.room_code,
                "archived_at": r.archived_at.isoformat() if r.archived_at else None,
                "message_count": message_counts.get(r.id, 0)
            }
            for r in rooms
        ],
        "total": total
    }

async def get_archived_room(db: AsyncSession, room_id: str, user_id: str | uuid.UUID):
    try:
        parsed_id = uuid.UUID(room_id)
    except ValueError:
        return None
        
    stmt = select(Room).where(Room.id == parsed_id, Room.owner_user_id == user_id, Room.status == 'archived')
    result = await db.execute(stmt)
    room = result.scalar_one_or_none()
    
    if not room:
        return None
        
    # Fetch messages
    msg_stmt = select(Message).where(Message.room_id == parsed_id).order_by(Message.sent_at)
    msg_result = await db.execute(msg_stmt)
    messages = msg_result.scalars().all()
    
    return {
        "id": str(room.id),
        "room_name": room.room_name,
        "created_at": room.created_at.isoformat(),
        "archived_at": room.archived_at.isoformat() if room.archived_at else None,
        "messages": [
            {
                "nickname": m.nickname,
                "content": m.content,
                "sent_at": m.sent_at.isoformat()
            }
            for m in messages
        ]
    }

async def delete_archived_room(db: AsyncSession, room_id: str, user_id: str | uuid.UUID) -> bool:
    try:
        parsed_id = uuid.UUID(room_id)
    except ValueError:
        return False
        
    stmt = select(Room).where(Room.id == parsed_id, Room.owner_user_id == user_id, Room.status == 'archived')
    result = await db.execute(stmt)
    room = result.scalar_one_or_none()
    
    if not room:
        return False
        
    await db.delete(room)
    await db.commit()
    return True
