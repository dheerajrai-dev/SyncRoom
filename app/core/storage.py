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

        # Maps room_code to a list of message dicts in memory
        self.room_messages: dict[str, list[dict]] = {}

    def get_messages(self, room_code: str) -> list[dict]:
        return self.room_messages.get(room_code.upper(), [])

    def add_message(self, room_code: str, message: dict):
        rc = room_code.upper()
        if rc not in self.room_messages:
            self.room_messages[rc] = []
        self.room_messages[rc].append(message)

    def edit_message(self, room_code: str, message_id: str, new_content: str) -> bool:
        rc = room_code.upper()
        for msg in self.room_messages.get(rc, []):
            if msg["message_id"] == message_id:
                msg["content"] = new_content
                return True
        return False

    def delete_message(self, room_code: str, message_id: str) -> bool:
        rc = room_code.upper()
        msgs = self.room_messages.get(rc, [])
        for i, msg in enumerate(msgs):
            if msg["message_id"] == message_id:
                del msgs[i]
                return True
        return False

    def add_pending_request(self, room_code: str, req_id: str, username: str):
        rc = room_code.upper()
        if rc not in self.pending_requests:
            self.pending_requests[rc] = {}
        self.pending_requests[rc][req_id] = username

    def get_pending_request(self, room_code: str, req_id: str):
        rc = room_code.upper()
        return self.pending_requests.get(rc, {}).get(req_id)

    def remove_pending_request(self, room_code: str, req_id: str):
        rc = room_code.upper()
        if rc in self.pending_requests and req_id in self.pending_requests[rc]:
            del self.pending_requests[rc][req_id]

    def get_all_pending(self, room_code: str):
        rc = room_code.upper()
        return self.pending_requests.get(rc, {})

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
            
        rc = room_code.upper()
        if rc in self.pending_requests:
            del self.pending_requests[rc]
        if rc in self.room_messages:
            del self.room_messages[rc]

import os
# Global connection manager instance
manager = ConnectionManager()

MAX_PARTICIPANTS = 10
RECONNECT_TIMEOUT_SECONDS = 70
HOST_RECONNECT_GRACE_PERIOD_SECONDS = int(os.environ.get("HOST_GRACE_PERIOD", "45"))

def is_reconnect_expired(disconnected_at: datetime) -> bool:
    if not disconnected_at:
        return False
    elapsed = datetime.now(timezone.utc) - disconnected_at
    return elapsed.total_seconds() > RECONNECT_TIMEOUT_SECONDS

async def process_chat_message(
    participant_db_id,
    username: str,
    content: str,
    room_code: str
):
    message_record = {
        "type": "chat_message",
        "message_id": str(uuid.uuid4()),
        "participant_id": str(participant_db_id),
        "nickname": username,
        "content": content,
        "sent_at": datetime.now(timezone.utc).isoformat(),
    }
    
    manager.add_message(room_code, message_record)

    # Broadcast via ConnectionManager to all room participants
    await manager.broadcast_to_room(room_code, message_record)
    return message_record

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
            {"time": m.sent_at.isoformat(), "nickname": m.nickname, "content": m.content}
            for m in db_messages
        ],
    }