from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import Room


# Create a new room record in the database.
async def create_room_row(db: AsyncSession, room_code: str, host_token_hash: str) -> bool:
    # Add the new room to the session.
    db.add(
        Room(room_code = room_code, host_token_hash = host_token_hash)
        )
    try:
        # Save the changes to the database.
        await db.commit()
        return True
    except IntegrityError:
        # Undo the changes if the room already exists or another error happens.
        await db.rollback()
        return False


# Get one room by its room code.
async def get_room_by_code(db: AsyncSession, room_code: str) -> Room | None:
    # Search the database for the room code.
    result = await db.execute(select(Room).where(Room.room_code == room_code))
    return result.scalar_one_or_none()