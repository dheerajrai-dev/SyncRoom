from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from app.models.user import User
from app.core.auth import hash_password, verify_password

async def register_user(db: AsyncSession, username: str, password: str) -> User:
    # Check if username already exists
    existing_user = await db.execute(select(User).where(User.username == username))
    if existing_user.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="username_taken")
    
    # Create new user
    new_user = User(
        username=username,
        password_hash=hash_password(password),
        display_name=username
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

async def authenticate_user(db: AsyncSession, username: str, password: str) -> User:
    # Find user by username
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=401, detail="invalid_credentials")
    
    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="invalid_credentials")
    
    return user
