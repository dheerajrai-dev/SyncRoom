"""
ORM models for the application.
"""
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

from .room import Room
from .participant import Participant
from .message import Message
from .user import User
