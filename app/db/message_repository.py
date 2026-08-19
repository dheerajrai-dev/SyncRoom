from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Message


async def get_messages_for_room(db: AsyncSession, room_id) -> list[Message]:
    result = await db.execute(
        select(Message).where(Message.room_id == room_id).order_by(Message.sent_at)
    )
    return list(result.scalars().all())


async def save_messages_for_room(db: AsyncSession, room_id, messages_list: list[dict]):
    for msg in messages_list:
        try:
            sent_at = datetime.fromisoformat(msg["sent_at"])
        except Exception:
            sent_at = datetime.now(timezone.utc)
        message = Message(
            room_id=room_id,
            participant_id=msg.get("participant_id"),
            nickname=msg.get("nickname", "Unknown"),
            content=msg.get("content", ""),
            sent_at=sent_at
        )
        db.add(message)
    await db.commit()
