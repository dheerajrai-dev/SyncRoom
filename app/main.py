from fastapi import FastAPI , HTTPException , status 
from pwdlib import  PasswordHash
import secrets , string

app = FastAPI()
rooms = {}

@app.get("/")
async def read_root():
   return {"Hello": "World"}



def generate_code(length: int = 6):
    alphabet = string.ascii_uppercase + string.digits
    code = ''.join(secrets.choice(alphabet) for i in range(length))
    return code

def host_token():
    token = secrets.token_urlsafe(16)
    return token

@app.post("/rooms")
def create_room():
    room_code = generate_code()
    host_token_value = host_token()
    rooms[room_code] = {"host token": host_token_value}
    return {"message": "Room created successfully", "room code": room_code, "host token": host_token_value}

@app.get("/rooms/{room_code}")
def get_room(room_code: str):
    if room_code not in rooms:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    return {"room code": room_code, "host token": rooms[room_code]["host token"]}