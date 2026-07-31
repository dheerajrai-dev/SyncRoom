"""
ORM models for the application.
SQLAlchemy models are used to define the database schema and interact with the database.
"""

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Text, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    room_code: Mapped[str] = mapped_column(Text, unique=True)
    name: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        server_default=text("now()")
    )
    archived_at: Mapped[datetime | None]

    participants: Mapped[list["Participant"]] = relationship(
        back_populates="room"
    )
    messages: Mapped[list["Message"]] = relationship(
        back_populates="room"
    )


class Participant(Base):
    __tablename__ = "participants"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    room_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("rooms.id", ondelete="CASCADE")
    )
    nickname: Mapped[str] = mapped_column(Text)
    role: Mapped[str] = mapped_column(
        Text,
        server_default="participant",
    )
    joined_at: Mapped[datetime] = mapped_column(
        server_default=text("now()")
    )

    room: Mapped["Room"] = relationship(
        back_populates="participants"
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    room_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("rooms.id", ondelete="CASCADE")
    )
    participant_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("participants.id", ondelete="SET NULL")
    )
    nickname: Mapped[str] = mapped_column(Text)
    content: Mapped[str] = mapped_column(Text)
    sent_at: Mapped[datetime] = mapped_column(
        server_default=text("now()")
    )

    room: Mapped["Room"] = relationship(
        back_populates="messages"
    )