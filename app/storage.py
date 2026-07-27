import secrets , string
import uuid
from datetime import datetime , timedelta, timezone

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

def message_id():
    return str(uuid.uuid4())

def build_room_state(room: dict) -> dict:
    participants = []

    for pid, participant_data in room["participants"].items():
        participants.append({
            "participant_id": pid,
            "username": participant_data["username"]
        })

    return {
        "type": "room_state",
        "participants": participants,
        "messages": room["messages"]
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
):
    """
    Build, store, and broadcast a chat message.
    Used by both the participant and host websocket loops.
    """
    message_record = {
        "type": "chat_message",
        "message_id": message_id(),
        "participant_id": sender_id,
        "username": username,
        "content": content,
    }

    room["messages"].append(message_record)

    await broadcast_message(
        message_record,
        room,
        exclude_participant_id=sender_id
    )

    return 


RECONNECT_TIMEOUT_SECONDS = 70

def is_reconnect_expired(disconnected_at: datetime) -> bool:

    elapsed = datetime.now(timezone.utc) - disconnected_at

    return elapsed.total_seconds() > RECONNECT_TIMEOUT_SECONDS

MAX_PARTICIPANTS = 10