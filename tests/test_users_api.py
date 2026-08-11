import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
import uuid
from app.main import app
from app.db.session import get_db
from tests.db_test_utils import TestingSessionLocal
from sqlalchemy import text
from app.core.auth import create_access_token
from app.models.user import User

@pytest_asyncio.fixture(autouse=True)
async def cleanup_db():
    yield
    async with TestingSessionLocal() as session:
        await session.execute(text("DELETE FROM users WHERE username LIKE 'testuser_%'"))
        await session.commit()

# Override get_db for tests
async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

@pytest.mark.asyncio
async def test_get_users_me():
    test_username = f"testuser_{uuid.uuid4().hex[:8]}"
    
    # Register user directly via DB
    async with TestingSessionLocal() as session:
        user = User(
            username=test_username,
            password_hash="fakehash",
            display_name=test_username
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        user_id = str(user.id)
        
    access_token = create_access_token(user_id)
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        # Request with valid token
        response = await client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == user_id
        assert data["username"] == test_username
        
        # Request with invalid token
        response = await client.get(
            "/api/v1/users/me",
            headers={"Authorization": "Bearer badtoken"}
        )
        assert response.status_code == 401
        
        # Request with missing token
        response = await client.get(
            "/api/v1/users/me"
        )
        assert response.status_code == 401
