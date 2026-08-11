from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import json

from ..deps import get_current_user
from ...db.session import get_db
from ...models.user import User
from ...services.dashboard_service import get_archived_rooms, get_archived_room, delete_archived_room

router = APIRouter()

@router.get("/rooms")
async def list_dashboard_rooms(
    q: Optional[str] = Query(None, alias="q"),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return await get_archived_rooms(db, user.id, limit=limit, offset=offset, query=q)

@router.get("/rooms/{room_id}")
async def get_dashboard_room(
    room_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    room = await get_archived_room(db, room_id, user.id)
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="room_not_found")
    return room

@router.delete("/rooms/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dashboard_room(
    room_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    success = await delete_archived_room(db, room_id, user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="room_not_found")
    return None

@router.get("/rooms/{room_id}/export")
async def export_dashboard_room(
    room_id: str,
    format: str = Query(..., pattern="^(json|txt)$"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    room = await get_archived_room(db, room_id, user.id)
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="room_not_found")
        
    safe_room_name = "".join(c for c in room["room_name"] if c.isalnum() or c in " _-").strip()
    if not safe_room_name:
        safe_room_name = "room_export"
        
    filename = f"{safe_room_name}.{format}"
    
    if format == "json":
        content = json.dumps(room, indent=2)
        media_type = "application/json"
    else:
        # TXT format
        lines = []
        lines.append(f"Room: {room['room_name']}")
        lines.append(f"Created At: {room['created_at']}")
        lines.append(f"Archived At: {room['archived_at']}")
        lines.append("-" * 40)
        
        for msg in room["messages"]:
            lines.append(f"[{msg['sent_at']}] {msg['nickname']}: {msg['content']}")
            
        content = "\n".join(lines)
        media_type = "text/plain"
        
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
