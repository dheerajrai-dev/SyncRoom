import uuid
from datetime import datetime
from sqlalchemy import DateTime, Text, text, func, ForeignKey, Boolean, Integer, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING
from . import Base

if TYPE_CHECKING:
    from .participant import Participant
    from .message import Message

class Room(Base):
    __tablename__ = "rooms"

    __table_args__ = (
        Index("ix_rooms_room_code_live", "room_code", unique=True, postgresql_where=text("status IN ('waiting', 'active', 'host_grace')")),
        Index("ix_rooms_owner_user_id", "owner_user_id"),
        Index("ix_rooms_ttl_expires_at", "ttl_expires_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, server_default=text("gen_random_uuid()"))
    room_code: Mapped[str] = mapped_column(Text, nullable=False)
    room_name: Mapped[str] = mapped_column(Text, server_default="'Untitled Room'", nullable=False)
    owner_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    status: Mapped[str] = mapped_column(Text, server_default="'waiting'", nullable=False)
    is_saved: Mapped[bool] = mapped_column(Boolean, server_default=text("false"), nullable=False)
    participant_count: Mapped[int] = mapped_column(Integer, server_default="0", nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ttl_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now() + interval '24 hours'"), nullable=False)

    locked: Mapped[bool] = mapped_column(server_default=text("false"), nullable=False)
    host_token_hash: Mapped[str] = mapped_column(Text, nullable=False)

    participants: Mapped[list["Participant"]] = relationship(back_populates="room", cascade="all, delete-orphan", passive_deletes=True)
    messages: Mapped[list["Message"]] = relationship(back_populates="room", cascade="all, delete-orphan", passive_deletes=True)
