import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
import uuid
from app.main import app
from app.db.session import get_db
from tests.db_test_utils import TestingSessionLocal
from sqlalchemy import text

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
async def test_register_and_login():
    test_username = f"testuser_{uuid.uuid4().hex[:8]}"
    test_password = "SecurePassword123"
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        # 1. Register
        response = await client.post(
            "/api/v1/auth/register",
            json={"username": test_username, "password": test_password}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == test_username
        assert "user_id" in data
        
        # 2. Register again (conflict)
        response = await client.post(
            "/api/v1/auth/register",
            json={"username": test_username, "password": test_password}
        )
        assert response.status_code == 409
        
        # 3. Login
        response = await client.post(
            "/api/v1/auth/login",
            json={"username": test_username, "password": test_password}
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["username"] == test_username
        
        # Check refresh token cookie
        assert "refresh_token" in response.cookies
        
        # 4. Refresh
        # We need to simulate passing the cookie back
        response = await client.post(
            "/api/v1/auth/refresh",
            cookies=response.cookies
        )
        assert response.status_code == 200
        refresh_data = response.json()
        assert "access_token" in refresh_data
        
        # 5. Logout
        response = await client.post(
            "/api/v1/auth/logout",
            cookies=response.cookies
        )
        assert response.status_code == 200
        # Cookie should be deleted
        assert "refresh_token" not in response.cookies or not response.cookies.get("refresh_token")

@pytest.mark.asyncio
async def test_invalid_login():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        # Bad username
        response = await client.post(
            "/api/v1/auth/login",
            json={"username": "not_real_user", "password": "password123"}
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "invalid_credentials"

@pytest.mark.asyncio
async def test_validation_errors():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        # Password too short
        response = await client.post(
            "/api/v1/auth/register",
            json={"username": "valid_user", "password": "short"}
        )
        assert response.status_code == 422
        
        # Username too short
        response = await client.post(
            "/api/v1/auth/register",
            json={"username": "ab", "password": "LongEnoughPassword"}
        )
        assert response.status_code == 422
