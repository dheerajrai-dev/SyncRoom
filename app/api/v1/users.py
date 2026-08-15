from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.api.deps import get_current_user
from app.db.session import get_db
from app.schemas import UserProfile, UpdateProfileRequest

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserProfile)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return UserProfile(
        id=str(current_user.id),
        username=current_user.username,
        display_name=current_user.display_name,
        avatar_url=current_user.avatar_url
    )

@router.patch("/me", response_model=UserProfile)
async def update_users_me(
    req: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if req.display_name is not None:
        current_user.display_name = req.display_name.strip() or current_user.username
    if req.avatar_url is not None:
        current_user.avatar_url = req.avatar_url.strip() or None
        
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    
    return UserProfile(
        id=str(current_user.id),
        username=current_user.username,
        display_name=current_user.display_name,
        avatar_url=current_user.avatar_url
    )
