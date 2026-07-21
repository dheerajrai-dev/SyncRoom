
import secrets , string

rooms = {}

def generate_code(length: int = 6):
    alphabet = string.ascii_uppercase + string.digits
    code = ''.join(secrets.choice(alphabet) for i in range(length))
    return code

def host_token():
    token = secrets.token_urlsafe(16)
    return token

