from pydantic import BaseModel

class Room_Code(BaseModel):
    code: str
    host_token: str

class JoinRequest(BaseModel):
    username: str

class JoinResponse(BaseModel):
    participant_id: str
    pending: bool

class ApproveRequest(BaseModel):
    participant_id: str

class DeniedRequest(BaseModel):
    participant_id: str

class chat_Message(BaseModel):
    type: str
    content: str

class RoomName(BaseModel):
    name: str