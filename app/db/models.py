"""
ORM models for the application.
SQLAlchemy models are used to define the database schema and interact with the database.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text, text, Index
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, server_default=text("gen_random_uuid()"))

    room_code: Mapped[str] = mapped_column(Text, unique=True, nullable=False)

    name: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)

    locked: Mapped[bool] = mapped_column(server_default=text("false"), nullable=False)

    host_token_hash: Mapped[str] = mapped_column(Text, nullable=False)

    participants: Mapped[list["Participant"]] = relationship(back_populates="room")

    messages: Mapped[list["Message"]] = relationship(back_populates="room")


class Participant(Base):
    __tablename__ = "participants"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, server_default=text("gen_random_uuid()"))

    room_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)

    nickname: Mapped[str] = mapped_column(Text, nullable=False)

    role: Mapped[str] = mapped_column(Text, server_default=text("'participant'"), nullable=False)

    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)

    left_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    room: Mapped["Room"] = relationship(back_populates="participants")


class Message(Base):
    __tablename__ = "messages"

    __table_args__ = (Index("ix_messages_room_id_sent_at", "room_id", "sent_at"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, server_default=text("gen_random_uuid()"))

    room_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)

    participant_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("participants.id", ondelete="SET NULL"), nullable=True)

    nickname: Mapped[str] = mapped_column(Text, nullable=False)

    content: Mapped[str] = mapped_column(Text, nullable=False)

    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)

    room: Mapped["Room"] = relationship(back_populates="messages")