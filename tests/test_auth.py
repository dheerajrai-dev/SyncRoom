import pytest
import jwt
from datetime import datetime, timezone, timedelta
import time
from app.core.auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    SECRET_KEY,
    ALGORITHM
)

def test_password_hashing():
    password = "my_secure_password"
    hashed = hash_password(password)
    
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong_password", hashed) is False

def test_jwt_access_token():
    subject = "user123"
    token = create_access_token(subject)
    
    payload = decode_token(token)
    assert payload["sub"] == subject
    assert payload["type"] == "access"
    assert "exp" in payload
    
def test_jwt_refresh_token():
    subject = "user456"
    token = create_refresh_token(subject)
    
    payload = decode_token(token)
    assert payload["sub"] == subject
    assert payload["type"] == "refresh"
    assert "exp" in payload

def test_invalid_token():
    with pytest.raises(jwt.InvalidTokenError):
        decode_token("not_a_real_token")

def test_expired_token():
    # Create a token that expired in the past
    expire = datetime.now(timezone.utc) - timedelta(minutes=1)
    to_encode = {"exp": expire, "sub": "user1", "type": "access"}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    with pytest.raises(jwt.ExpiredSignatureError):
        decode_token(encoded_jwt)
