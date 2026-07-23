from fastapi import FastAPI , HTTPException , status , Header , Depends , WebSocket ,WebSocketDisconnect
from .storage import generate_code , host_token , rooms , participant_id , ws_token
from .model import ApproveRequest, Room_Code , JoinRequest , JoinResponse , deniedRequest


app = FastAPI()


@app.get("/")
async def read_root():
   return {"Hello": "World"}


# generate a room code and host token 
@app.post("/rooms", response_model=Room_Code , status_code=status.HTTP_201_CREATED)
def create_room():
    room_code = generate_code()
    host_token_value = host_token()
    rooms[room_code] = {"host token": host_token_value , "participants": {}}
    return Room_Code(code=room_code, host_token=host_token_value)


# get room code and host token
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


# delete a room by verfiying the host token
@app.delete("/rooms/{room_code}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(room_code: str, room: dict = Depends(verify_host_token)):
    del rooms[room_code]
    

# request to join a room by providing the room code and a participant id
@app.post("/rooms/{room_code}/join", response_model=JoinResponse , status_code=status.HTTP_202_ACCEPTED)
def join_room(room_code:str , join_request: JoinRequest):
    room = rooms.get(room_code)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    participant_id_value = participant_id()
    rooms[room_code]["participants"][participant_id_value] = {"username": join_request.username ,
                                                               "status": "pending"}
    return JoinResponse(participant_id=participant_id_value, pending=True)

#request to see the list of participants in a room by providing the room code and host token
@app.get("/rooms/{room_code}/participants")
def get_participants(room_code: str,
                      room: dict = Depends(verify_host_token)
                      ):
    result = []
    for participant_id, participant_data in rooms[room_code]["participants"].items():

        result.append(
            {"id": participant_id,
            "username": participant_data["username"],
            "status": participant_data["status"]
            })
    return {"participants": result}


# request to approve a participant by providing the room code, host token and participant id
@app.post("/rooms/{room_code}/approve")
def approve_participant(
    room_code: str,
    approve_request: ApproveRequest,
    room: dict = Depends(verify_host_token)
):
    participant = room["participants"].get(approve_request.participant_id)
    if room_code not in rooms:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )

    if participant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found"
        )

    participant["status"] = "approved"
    participant["ws_token"] = ws_token()

    return {"message": "Participant approved successfully",
            "participant_id": approve_request.participant_id,
            "ws_token": participant["ws_token"]}

# participant can request to get their status by providing the room code and participant id
@app.get("/rooms/{room_code}/join/{participant_id}/status")
def check_join_status(room_code: str, participant_id: str):
    room = rooms.get(room_code)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    participant = room["participants"].get(participant_id)
    if participant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

    response = {"status": participant["status"]}
    if participant["status"] == "approved":
        response["ws_token"] = participant["ws_token"]
    return response


# Request to deny the participants
@app.post("/rooms/{room_code}/deny")
def denied_participant(
    room_code : str,
    denied_request :deniedRequest,
    room: dict = Depends(verify_host_token)
    ):
    participant = room["participants"].get(denied_request.participant_id)
    if room_code not in rooms:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    if participant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found"
        )
    
    participant["status"] = "denied"
    
    return {"message": "Participant denied successfully",
            "participant_id": denied_request.participant_id }

#test websocket connection
@app.websocket("/ws/echos")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    try: 
     while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Message text was: {data}")

    except WebSocketDisconnect:
        print("Client disconnected")