import secrets , string
import uuid , asyncio
from datetime import datetime ,  timezone

from .db.room_repository import delete_room_row
from .db.message_repository import create_message_row, get_messages_for_room
from .db.session import AsyncSessionLocal

rooms = {}

def generate_code(length: int = 6):
    alphabet = string.ascii_uppercase + string.digits
    code = ''.join(secrets.choice(alphabet) for i in range(length))
    return code

def host_token():
    token = secrets.token_urlsafe(16)
    return token

def participant_id():
    return str(uuid.uuid4())

def ws_token():
    ws_token = secrets.token_urlsafe(16)
    return ws_token

def gather_export_data(room_code: str, room: dict, room_name: str | None, db_messages: list) -> dict:
    participants = ["Host"]
    participants += [
        p["username"] for p in room["participants"].values()
        if p["status"] == "approved"
    ]
    return {
        "room_name": room_name or room_code,
        "participants": participants,
        "messages": [
            {"time": m.sent_at.isoformat(), "username": m.nickname, "content": m.content}
            for m in db_messages
        ],
    }

async def build_room_state(room: dict) -> dict:
    participants = []
    for pid, participant_data in room["participants"].items():
        participants.append({
            "participant_id": pid,
            "username": participant_data["username"]
        })

    async with AsyncSessionLocal() as session:
        db_messages = await get_messages_for_room(session, room["db_id"])

    return {
        "type": "room_state",
        "participants": participants,
        "messages": [
            {"username": m.nickname, "content": m.content, "sent_at": m.sent_at.isoformat()}
            for m in db_messages
        ]
    }

async def broadcast_message(
    message: dict,
    room: dict,
    exclude_participant_id: str | None = None
):
    for pid, participant in room["participants"].items():

        if pid == exclude_participant_id:
            continue

        connection = participant.get("websocket")

        if connection:
            await connection.send_json(message)

    host_connection = room.get("host_connection")
    if host_connection:
        host_websocket = host_connection.get("websocket")
        if host_websocket and exclude_participant_id != "host":
            await host_websocket.send_json(message)


async def process_chat_message(
    content: str,
    room: dict,
    sender_id: str,
    username: str,
    participant_db_id,
):
    db_message = await create_message_row(room["db_id"], participant_db_id, username, content)

    message_record = {
        "type": "chat_message",
        "message_id": str(db_message.id),
        "participant_id": sender_id,
        "username": username,
        "content": content,
        "sent_at": db_message.sent_at.isoformat(),
    }

    await broadcast_message(message_record, room, exclude_participant_id=sender_id)
    return 


RECONNECT_TIMEOUT_SECONDS = 70

def is_reconnect_expired(disconnected_at: datetime) -> bool:

    elapsed = datetime.now(timezone.utc) - disconnected_at

    return elapsed.total_seconds() > RECONNECT_TIMEOUT_SECONDS

MAX_PARTICIPANTS = 10

async def close_and_delete_room(room_code: str):
    room = rooms.get(room_code)

    if not room:
        return

    await broadcast_message({
            "type": "room_deleted",
            "message": "Room has been deleted by the host"
        }, room)

    # Close all participant websockets
    for pid, participant in room["participants"].items():
        connection = participant.get("websocket")
        if connection:
            await connection.close()

    # Close host websocket
    host_connection = room.get("host_connection")
    if host_connection:
        host_websocket = host_connection.get("websocket")
        if host_websocket:
            await host_websocket.close()

    await delete_room_row(room_code)

    # Remove the room from the global dictionary
    del rooms[room_code]

HOST_RECONNECT_GRACE_PERIOD_SECONDS = 300
async def host_grace_timer(room_code: str, disconnected_at: datetime):
    await asyncio.sleep(HOST_RECONNECT_GRACE_PERIOD_SECONDS)

    room = rooms.get(room_code)
    if room is None:
        return

    current_disconnect = room["host_connection"]["disconnected_at"]

    # Host reconnected
    if current_disconnect is None:
        return

    # A newer disconnect happened, so this timer is stale
    if current_disconnect != disconnected_at:
        return

    # This timer still belongs to the current disconnect
    await close_and_delete_room(room_code)