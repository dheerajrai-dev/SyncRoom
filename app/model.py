from pydantic import BaseModel

class Room_Code(BaseModel):
    code: str
    host_token: str