import os
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
import jwt

load_dotenv()

# JWT configuration
SECRET_KEY = os.environ["JWT_SECRET"]
ALGORITHM = os.environ["JWT_ALGORITHM"]
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"])
REFRESH_TOKEN_EXPIRE_DAYS = int(os.environ["REFRESH_TOKEN_EXPIRE_DAYS"])

# Password hashing context using Argon2id
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hashes a password using Argon2id."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against an Argon2id hash."""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(subject: str) -> str:
    """Creates a short-lived JWT access token."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: str) -> str:
    """Creates a long-lived JWT refresh token."""
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict:
    """
    Decodes and verifies a JWT token.
    Raises jwt.ExpiredSignatureError if expired, or jwt.InvalidTokenError if invalid.
    """
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
