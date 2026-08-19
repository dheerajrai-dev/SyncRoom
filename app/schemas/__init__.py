"""
Schemas for request and response bodies.
pydantic models are used to validate and serialize data.

"""

from pydantic import BaseModel

class Room_Code(BaseModel):
    room_id: str
    code: str
    host_token: str
    owner: bool
    ttl_expires_at: str

class CreateRoomRequest(BaseModel):
    room_name: str | None = None


class RoomInfo(BaseModel):
    room_id: str
    code: str
    name: str | None
    locked: bool

class JoinRequest(BaseModel):
    nickname: str

class JoinResponse(BaseModel):
    participant_id: str
    pending: bool

class ApproveRequest(BaseModel):
    participant_id: str

class DeniedRequest(BaseModel):
    participant_id: str

from typing import Literal, Union, Annotated
from pydantic import Field

class ChatPayload(BaseModel):
    content: str

class ChatMessagePayload(BaseModel):
    type: Literal["chat_message"] = "chat_message"
    payload: ChatPayload | None = None
    content: str | None = None

    def get_content(self) -> str:
        if self.payload:
            return self.payload.content
        return self.content or ""

class EditPayload(BaseModel):
    message_id: str
    content: str

class EditMessagePayload(BaseModel):
    type: Literal["edit_message"] = "edit_message"
    payload: EditPayload | None = None
    message_id: str | None = None
    content: str | None = None

    def get_data(self) -> tuple[str, str]:
        if self.payload:
            return self.payload.message_id, self.payload.content
        return self.message_id or "", self.content or ""

class DeletePayload(BaseModel):
    message_id: str

class DeleteMessagePayload(BaseModel):
    type: Literal["delete_message"] = "delete_message"
    payload: DeletePayload | None = None
    message_id: str | None = None

    def get_message_id(self) -> str:
        if self.payload:
            return self.payload.message_id
        return self.message_id or ""

class PresencePingPayload(BaseModel):
    type: Literal["presence_ping"] = "presence_ping"

ClientMessage = Annotated[
    Union[
        ChatMessagePayload,
        EditMessagePayload,
        DeleteMessagePayload,
        PresencePingPayload,
    ],
    Field(discriminator="type"),
]

class ServerRoomUpdatedPayload(BaseModel):
    type: Literal["room_updated"] = "room_updated"
    room_name: str | None = None
    locked: bool | None = None

class ServerHostGraceStartedPayload(BaseModel):
    type: Literal["host_disconnected_grace_started"] = "host_disconnected_grace_started"
    grace_expires_at: str

class RoomName(BaseModel):
    name: str

class CloseRoomRequest(BaseModel):
    save: bool

class RoomUpdateRequest(BaseModel):
    room_name: str | None = None
    locked: bool | None = None

# Auth Schemas
class RegisterRequest(BaseModel):
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class UserProfile(BaseModel):
    id: str
    username: str
    display_name: str
    avatar_url: str | None

class UpdateProfileRequest(BaseModel):
    display_name: str | None = None
    avatar_url: str | None = None

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserProfile

class RefreshResponse(BaseModel):
    access_token: str
    expires_in: int