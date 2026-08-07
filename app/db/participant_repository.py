from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import Participant


async def create_participant_row(db: AsyncSession, room_id, nickname: str, role: str = "participant") -> Participant:
    participant = Participant(room_id=room_id, nickname=nickname, role=role)
    db.add(participant)
    await db.flush()
    await db.commit()
    return participant


async def mark_participant_left(db: AsyncSession, participant_id) -> None:
    result = await db.execute(select(Participant).where(Participant.id == participant_id))
    db_participant = result.scalar_one_or_none()
    if db_participant is None:
        return
    db_participant.left_at = datetime.now(timezone.utc)
    await db.commit()
