from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.models import Message


async def create_message_row(room_id, participant_id, nickname: str, content: str) -> Message:
    async with AsyncSessionLocal() as session:
        message = Message(room_id=room_id, participant_id=participant_id, nickname=nickname, content=content)
        session.add(message)
        await session.commit()
        await session.refresh(message)
        return message


async def get_messages_for_room(db: AsyncSession, room_id) -> list[Message]:
    result = await db.execute(
        select(Message).where(Message.room_id == room_id).order_by(Message.sent_at)
    )
    return list(result.scalars().all())
