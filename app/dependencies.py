from fastapi import Header, HTTPException, status
from .storage import rooms

def verify_host_token(room_code: str, token: str = Header(...)):
    room = rooms.get(room_code)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    if room["host_token"] != token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid host token")
    return room