import uuid
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Text, text, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING
from . import Base

if TYPE_CHECKING:
    from .room import Room

class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (Index("ix_messages_room_id_sent_at", "room_id", "sent_at"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, server_default=text("gen_random_uuid()"))
    room_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    participant_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("participants.id", ondelete="SET NULL"), nullable=True)
    nickname: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    room: Mapped["Room"] = relationship(back_populates="messages")
