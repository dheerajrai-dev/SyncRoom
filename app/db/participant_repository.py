from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Participant


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

async def get_participant_by_id(db: AsyncSession, participant_id) -> Participant | None:
    result = await db.execute(select(Participant).where(Participant.id == participant_id))
    return result.scalar_one_or_none()

async def get_active_participants(db: AsyncSession, room_id) -> list[Participant]:
    result = await db.execute(
        select(Participant)
        .where(Participant.room_id == room_id)
        .where(Participant.left_at.is_(None))
        .order_by(Participant.joined_at.asc())
    )
    return list(result.scalars().all())

async def get_host_participant(db: AsyncSession, room_id) -> Participant | None:
    result = await db.execute(
        select(Participant)
        .where(Participant.room_id == room_id)
        .where(Participant.role == "host")
        .where(Participant.left_at.is_(None))
    )
    return result.scalar_one_or_none()
