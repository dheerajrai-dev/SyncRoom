import asyncio
from sqlalchemy import select, text
from app.db.session import AsyncSessionLocal
from app.models.room import Room
from app.services.room_service import close_room
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

async def perform_ttl_sweep():
    async with AsyncSessionLocal() as db:
        # Find all expired rooms
        query = select(Room.id).where(
            Room.ttl_expires_at < text("now()"),
            Room.status != 'archived'
        )
        result = await db.execute(query)
        expired_room_ids = result.scalars().all()
        
        for room_id in expired_room_ids:
            try:
                await close_room(db, str(room_id), save=False, reason="ttl_expired")
            except Exception as e:
                logger.error(f"Error during TTL sweep for room {room_id}: {e}")

async def sweep_task_loop(interval_seconds: int = 600):
    while True:
        try:
            await perform_ttl_sweep()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"TTL sweep task encountered an error: {e}")
        await asyncio.sleep(interval_seconds)

def start_sweep_task(interval_seconds: int = 600) -> asyncio.Task:
    return asyncio.create_task(sweep_task_loop(interval_seconds))
