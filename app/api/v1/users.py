from fastapi import APIRouter, Depends
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas import UserProfile

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserProfile)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return UserProfile(
        id=str(current_user.id),
        username=current_user.username,
        display_name=current_user.display_name,
        avatar_url=current_user.avatar_url
    )
