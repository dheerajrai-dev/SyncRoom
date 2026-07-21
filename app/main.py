from fastapi import FastAPI , HTTPException , status , Header , Depends
from .storage import generate_code , host_token , rooms
from .model import Room_Code

app = FastAPI()


@app.get("/")
async def read_root():
   return {"Hello": "World"}



@app.post("/rooms", response_model=Room_Code , status_code=status.HTTP_201_CREATED)
def create_room():
    room_code = generate_code()
    host_token_value = host_token()
    rooms[room_code] = {"host token": host_token_value}
    return Room_Code(code=room_code, host_token=host_token_value)

@app.get("/rooms/{room_code}", response_model=Room_Code)
def get_room(room_code: str):
    if room_code not in rooms:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    return Room_Code(code=room_code, host_token=rooms[room_code]["host token"])

def verify_host_token(room_code: str, token: str=Header(...)):
    room = rooms.get(room_code)
    if room_code is None or room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    if rooms[room_code]["host token"] != token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid host token")
    return room

@app.delete("/rooms/{room_code}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(room_code: str, room: dict = Depends(verify_host_token)):
    del rooms[room_code]
    