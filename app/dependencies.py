from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from .db.room_repository import get_room_by_code
from .db.session import get_db
from .security import verify_token
from .storage import rooms


async def verify_host_token(
    room_code: str,
    token: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    db_room = await get_room_by_code(db, room_code)
    if db_room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    if not verify_token(token, db_room.host_token_hash):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid host token")

    room = rooms.get(room_code)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    return room