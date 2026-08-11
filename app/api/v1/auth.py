import re
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas import RegisterRequest, LoginRequest, LoginResponse, RefreshResponse, UserProfile
from app.services.auth_service import register_user, authenticate_user
from app.core.auth import create_access_token, create_refresh_token, decode_token, ACCESS_TOKEN_EXPIRE_MINUTES
import jwt

router = APIRouter(prefix="/auth", tags=["auth"])

def validate_password(password: str):
    if len(password) < 10:
        raise HTTPException(status_code=422, detail="validation_failure")
        
def validate_username(username: str):
    if not (3 <= len(username) <= 32) or not re.match(r"^[a-zA-Z0-9_]+$", username):
        raise HTTPException(status_code=422, detail="validation_failure")

@router.post("/register", status_code=201)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    validate_username(req.username)
    validate_password(req.password)
    
    user = await register_user(db, req.username, req.password)
    return {"user_id": str(user.id), "username": user.username}

@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, req.username, req.password)
    
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    
    # Set refresh token in HTTP-only, Secure cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="none"
    )
    
    return LoginResponse(
        access_token=access_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserProfile(
            id=str(user.id),
            username=user.username,
            display_name=user.display_name,
            avatar_url=user.avatar_url
        )
    )

@router.post("/refresh", response_model=RefreshResponse)
async def refresh(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="missing_refresh_token")
        
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="invalid_token_type")
        subject = payload.get("sub")
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        raise HTTPException(status_code=401, detail="invalid_refresh_token")
        
    # Create new access token
    access_token = create_access_token(subject)
    
    # Optional: Rotate the refresh token
    new_refresh_token = create_refresh_token(subject)
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=True,
        samesite="none"
    )
    
    return RefreshResponse(
        access_token=access_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=True,
        samesite="none"
    )
    return {"status": "logged_out"}
