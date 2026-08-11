import secrets
import string
import uuid
import asyncio
from datetime import datetime, timezone
from ..db.room_repository import delete_room_row
from ..db.message_repository import create_message_row
from ..db.session import AsyncSessionLocal
from fastapi import WebSocket

def generate_code(length: int = 6):
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def host_token():
    return secrets.token_urlsafe(16)

def participant_id():
    return str(uuid.uuid4())

def ws_token():
    return secrets.token_urlsafe(16)

class ConnectionManager:
    def __init__(self):
        # Maps participant_id (string UUID) to their runtime connection state
        self.active_connections: dict[str, dict] = {}
        
        # Maps room_code to a dict of pending join requests (request_id -> username)
        self.pending_requests: dict[str, dict[str, str]] = {}
        
        # Maps room_code to a set of connected participant_ids (for easy broadcasting)
        self.room_connections: dict[str, set[str]] = {}

    def add_pending_request(self, room_code: str, req_id: str, username: str):
        if room_code not in self.pending_requests:
            self.pending_requests[room_code] = {}
        self.pending_requests[room_code][req_id] = username

    def get_pending_request(self, room_code: str, req_id: str):
        return self.pending_requests.get(room_code, {}).get(req_id)

    def remove_pending_request(self, room_code: str, req_id: str):
        if room_code in self.pending_requests and req_id in self.pending_requests[room_code]:
            del self.pending_requests[room_code][req_id]

    def get_all_pending(self, room_code: str):
        return self.pending_requests.get(room_code, {})

    def pre_register_connection(self, participant_id: str, room_code: str, ws_token: str):
        self.active_connections[participant_id] = {
            "websocket": None,
            "room_code": room_code,
            "ws_token": ws_token,
            "disconnected_at": None,
            "reconnect_task": None
        }

    def register_connection(self, participant_id: str, room_code: str, websocket: WebSocket):
        conn = self.active_connections.get(participant_id)
        if not conn:
            self.active_connections[participant_id] = {
                "websocket": websocket,
                "room_code": room_code,
                "ws_token": None,
                "disconnected_at": None,
                "reconnect_task": None
            }
        else:
            conn["websocket"] = websocket
            conn["disconnected_at"] = None
            conn["reconnect_task"] = None
            
        if room_code not in self.room_connections:
            self.room_connections[room_code] = set()
        self.room_connections[room_code].add(participant_id)

    def get_connection(self, participant_id: str) -> dict | None:
        return self.active_connections.get(participant_id)
        
    def get_participant_id_by_token(self, ws_token: str) -> str | None:
        for pid, conn in self.active_connections.items():
            if conn["ws_token"] == ws_token:
                return pid
        return None
        
    def get_websocket(self, participant_id: str) -> WebSocket | None:
        conn = self.get_connection(participant_id)
        return conn["websocket"] if conn else None

    def mark_disconnected(self, participant_id: str):
        conn = self.active_connections.get(participant_id)
        if conn:
            conn["websocket"] = None
            conn["disconnected_at"] = datetime.now(timezone.utc)
            
    def remove_connection(self, participant_id: str):
        conn = self.active_connections.pop(participant_id, None)
        if conn and conn["room_code"] in self.room_connections:
            self.room_connections[conn["room_code"]].discard(participant_id)

    async def broadcast_to_room(self, room_code: str, message: dict, exclude_participant_id: str = None):
        if room_code not in self.room_connections:
            return
            
        disconnected_pids = []
        for pid in self.room_connections[room_code]:
            if pid == exclude_participant_id:
                continue
            conn = self.active_connections.get(pid)
            if conn and conn["websocket"]:
                try:
                    await conn["websocket"].send_json(message)
                except Exception:
                    # Stale connection
                    disconnected_pids.append(pid)
                    
        for pid in disconnected_pids:
            self.mark_disconnected(pid)

    async def close_room(self, room_code: str):
        if room_code not in self.room_connections:
            return
            
        pids = list(self.room_connections[room_code])
        for pid in pids:
            conn = self.active_connections.get(pid)
            if conn and conn["websocket"]:
                try:
                    await conn["websocket"].close()
                except Exception:
                    pass
            self.remove_connection(pid)
            
        if room_code in self.pending_requests:
            del self.pending_requests[room_code]

# Global connection manager instance
manager = ConnectionManager()

MAX_PARTICIPANTS = 10
RECONNECT_TIMEOUT_SECONDS = 70
HOST_RECONNECT_GRACE_PERIOD_SECONDS = 300

def is_reconnect_expired(disconnected_at: datetime) -> bool:
    if not disconnected_at:
        return False
    elapsed = datetime.now(timezone.utc) - disconnected_at
    return elapsed.total_seconds() > RECONNECT_TIMEOUT_SECONDS

async def process_chat_message(
    room_id,
    participant_db_id,
    username: str,
    content: str,
    room_code: str
):
    # Persist the message to PostgreSQL
    db_message = await create_message_row(room_id, participant_db_id, username, content)

    message_record = {
        "type": "chat_message",
        "message_id": str(db_message.id),
        "participant_id": str(participant_db_id),
        "username": username,
        "content": content,
        "sent_at": db_message.sent_at.isoformat(),
    }

    # Broadcast via ConnectionManager
    await manager.broadcast_to_room(room_code, message_record, exclude_participant_id=str(participant_db_id))
    return

async def close_and_delete_room(room_code: str):
    await manager.broadcast_to_room(room_code, {
        "type": "room_deleted",
        "message": "Room has been deleted by the host"
    })
    
    # Close sockets and clear memory
    await manager.close_room(room_code)
    
    # Delete from DB
    await delete_room_row(room_code)

def gather_export_data(room_name: str, active_participants: list, db_messages: list) -> dict:
    participants = [p.nickname for p in active_participants]
    return {
        "room_name": room_name,
        "participants": participants,
        "messages": [
            {"time": m.sent_at.isoformat(), "username": m.nickname, "content": m.content}
            for m in db_messages
        ],
    }