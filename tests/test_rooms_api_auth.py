import pytest
import pytest_asyncio
import uuid
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text
from app.main import app
from app.db.session import get_db
from tests.db_test_utils import TestingSessionLocal
from app.core.auth import create_access_token
from app.models.user import User

@pytest_asyncio.fixture(autouse=True)
async def cleanup_db():
    yield
    async with TestingSessionLocal() as session:
        await session.execute(text("DELETE FROM rooms WHERE room_code LIKE 'T%'"))
        await session.execute(text("DELETE FROM users WHERE username LIKE 'roomtest_%'"))
        await session.commit()

async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

@pytest.mark.asyncio
async def test_create_room_unauthenticated():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        response = await client.post("/api/v1/rooms", json={"room_name": "Guest Room"})
        assert response.status_code == 201
        data = response.json()
        assert data["owner"] is False
        assert "code" in data
        assert "ttl_expires_at" in data
        assert data["ttl_expires_at"] != ""
        
        # Verify in DB
        async with TestingSessionLocal() as session:
            room = (await session.execute(
                text("SELECT owner_user_id, room_name FROM rooms WHERE room_code = :code"),
                {"code": data["code"]}
            )).fetchone()
            assert room.owner_user_id is None
            assert room.room_name == "Guest Room"

@pytest.mark.asyncio
async def test_create_room_authenticated():
    test_username = f"roomtest_{uuid.uuid4().hex[:8]}"
    
    # 1. Create a user
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

    # 2. Create room with token
    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        response = await client.post(
            "/api/v1/rooms", 
            json={"room_name": "Auth Room"},
            headers={"Authorization": f"Bearer {access_token}"}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["owner"] is True
        
        # Verify in DB
        async with TestingSessionLocal() as session:
            room = (await session.execute(
                text("SELECT owner_user_id, room_name FROM rooms WHERE room_code = :code"),
                {"code": data["code"]}
            )).fetchone()
            assert str(room.owner_user_id) == user_id
            assert room.room_name == "Auth Room"
