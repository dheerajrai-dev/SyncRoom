
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

async def broadcast_message(
    message: dict,
    participants: dict,
    exclude_participant_id: str | None = None
):
    for participant_id, participant in participants.items():

        if participant_id == exclude_participant_id:
            continue

        connection = participant.get("websocket")

        if connection:
            await connection.send_json(message)

RECONNECT_TIMEOUT_SECONDS = 70

def is_reconnect_expired(disconnected_at: datetime) -> bool:

    elapsed = datetime.now(timezone.utc) - disconnected_at

    return elapsed.total_seconds() > RECONNECT_TIMEOUT_SECONDS