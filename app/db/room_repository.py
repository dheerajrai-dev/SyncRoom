from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Room
from app.db.session import AsyncSessionLocal


async def create_room_row(db: AsyncSession, room_code: str, host_token_hash: str) -> bool:
    db.add(Room(room_code=room_code, host_token_hash=host_token_hash))
    try:
        await db.commit()
        return True
    except IntegrityError:
        await db.rollback()
        return False


async def get_room_by_code(db: AsyncSession, room_code: str) -> Room | None:
    result = await db.execute(select(Room).where(Room.room_code == room_code))
    return result.scalar_one_or_none()


async def update_room_locked(db: AsyncSession, room_code: str, locked: bool) -> None:
    db_room = await get_room_by_code(db, room_code)
    if db_room is None:
        return
    db_room.locked = locked
    await db.commit()


async def update_room_name(db: AsyncSession, room_code: str, name: str) -> None:
    db_room = await get_room_by_code(db, room_code)
    if db_room is None:
        return
    db_room.name = name
    await db.commit()


async def delete_room_row(room_code: str) -> None:
    async with AsyncSessionLocal() as session:
        db_room = await get_room_by_code(session, room_code)
        if db_room is None:
            return
        await session.delete(db_room)
        await session.commit()