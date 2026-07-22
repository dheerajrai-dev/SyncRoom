
import secrets , string
import uuid

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