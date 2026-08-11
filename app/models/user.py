import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text, text, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import Base

class User(Base):
    __tablename__ = "users"

    __table_args__ = (
        Index("ix_users_username_lower", func.lower(func.cast(text("username"), Text)), unique=True),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, server_default=text("gen_random_uuid()"))
    username: Mapped[str] = mapped_column(String(32), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(64), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )
