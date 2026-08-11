import pytest
import pytest_asyncio
import uuid
from sqlalchemy import select, text
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.session import get_db
from tests.db_test_utils import TestingSessionLocal
from app.core.auth import create_access_token
from app.models.user import User
from app.models.room import Room
from app.models.participant import Participant
from app.models.message import Message
from app.services.ttl_sweep_service import perform_ttl_sweep

@pytest_asyncio.fixture(autouse=True)
async def cleanup_db_lifecycle():
    yield
    async with TestingSessionLocal() as session:
        await session.execute(text("DELETE FROM users WHERE username LIKE 'cascade_test_%'"))
        await session.execute(text("DELETE FROM users WHERE username LIKE 'closetest_%'"))
        await session.execute(text("DELETE FROM rooms WHERE room_code LIKE 'T%'"))
        await session.execute(text("DELETE FROM rooms WHERE room_code LIKE 'TTL%'"))
        await session.commit()

async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

@pytest.mark.asyncio
async def test_user_deletion_cascades_to_everything():
    async with TestingSessionLocal() as session:
        test_username = f"cascade_test_{uuid.uuid4().hex[:8]}"
        
        # 1. Create User
        user = User(
            username=test_username,
            password_hash="hash",
            display_name="Cascade Test User"
        )
        session.add(user)
        await session.flush()  # To get user.id
        
        # 2. Create Room owned by User
        room = Room(
            room_code=f"C{uuid.uuid4().hex[:4]}",
            host_token_hash="hash",
            owner_user_id=user.id
        )
        session.add(room)
        await session.flush()
        
        # 3. Create Participant
        participant = Participant(
            room_id=room.id,
            nickname="Test Participant",
            role="participant"
        )
        session.add(participant)
        await session.flush()
        
        # 4. Create Message
        message = Message(
            room_id=room.id,
            participant_id=participant.id,
            nickname="Test Participant",
            content="Hello world"
        )
        session.add(message)
        
        await session.commit()
        
        # Verify everything exists
        assert (await session.execute(select(User).where(User.id == user.id))).scalar_one_or_none() is not None
        assert (await session.execute(select(Room).where(Room.id == room.id))).scalar_one_or_none() is not None
        assert (await session.execute(select(Participant).where(Participant.id == participant.id))).scalar_one_or_none() is not None
        assert (await session.execute(select(Message).where(Message.id == message.id))).scalar_one_or_none() is not None
        
        # 5. Delete User
        await session.delete(user)
        await session.commit()
        
        # 6. Verify cascade deletion
        assert (await session.execute(select(Room).where(Room.id == room.id))).scalar_one_or_none() is None
        assert (await session.execute(select(Participant).where(Participant.id == participant.id))).scalar_one_or_none() is None
        assert (await session.execute(select(Message).where(Message.id == message.id))).scalar_one_or_none() is None

@pytest.mark.asyncio
async def test_guest_room_cannot_save():
    # 1. Create a guest room
    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        response = await client.post("/api/v1/rooms", json={"room_name": "Guest Room"})
        assert response.status_code == 201
        data = response.json()
        room_code = data["code"]
        host_token = data["host_token"]
        
        # 2. Try to end and save
        response = await client.post(
            f"/api/v1/rooms/{room_code}/end",
            json={"save": True},
            headers={"X-Host-Token": host_token}
        )
        assert response.status_code == 403
        assert response.json()["detail"] == "guest_rooms_cannot_be_saved"

@pytest.mark.asyncio
async def test_guest_room_can_delete():
    # 1. Create a guest room
    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        response = await client.post("/api/v1/rooms", json={"room_name": "Guest Room"})
        assert response.status_code == 201
        data = response.json()
        room_code = data["code"]
        host_token = data["host_token"]
        
        # 2. Delete it
        response = await client.post(
            f"/api/v1/rooms/{room_code}/end",
            json={"save": False},
            headers={"X-Host-Token": host_token}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "deleted"

@pytest.mark.asyncio
async def test_auth_room_can_save():
    test_username = f"closetest_{uuid.uuid4().hex[:8]}"
    
    # 1. Create user
    async with TestingSessionLocal() as session:
        user = User(username=test_username, password_hash="fake", display_name=test_username)
        session.add(user)
        await session.commit()
        await session.refresh(user)
        user_id = str(user.id)

    access_token = create_access_token(user_id)

    # 2. Create room
    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        response = await client.post(
            "/api/v1/rooms", 
            json={"room_name": "Auth Room"},
            headers={"Authorization": f"Bearer {access_token}"}
        )
        assert response.status_code == 201
        data = response.json()
        room_code = data["code"]
        host_token = data["host_token"]
        
        # 3. Save it
        response = await client.post(
            f"/api/v1/rooms/{room_code}/end",
            json={"save": True},
            headers={"X-Host-Token": host_token}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "archived"
        
        # Verify in DB
        async with TestingSessionLocal() as session:
            room = (await session.execute(
                text("SELECT status, is_saved FROM rooms WHERE room_code = :code"),
                {"code": room_code}
            )).fetchone()
            assert room.status == "archived"
            assert room.is_saved is True

@pytest.mark.asyncio
async def test_ttl_sweep_deletes_expired():
    # 1. Create a room that is expired, and one that is not
    async with TestingSessionLocal() as session:
        room_expired = Room(
            room_code="TTLEXP",
            room_name="Expired",
            host_token_hash="fake",
            ttl_expires_at=text("now() - interval '1 hour'")
        )
        room_fresh = Room(
            room_code="TTLFRE",
            room_name="Fresh",
            host_token_hash="fake",
            ttl_expires_at=text("now() + interval '1 hour'")
        )
        session.add(room_expired)
        session.add(room_fresh)
        await session.commit()
        
    # 2. Run the sweep
    await perform_ttl_sweep()
    
    # 3. Verify
    async with TestingSessionLocal() as session:
        result = await session.execute(text("SELECT room_code FROM rooms WHERE room_code IN ('TTLEXP', 'TTLFRE')"))
        codes = [row[0] for row in result.all()]
        assert "TTLFRE" in codes
        assert "TTLEXP" not in codes
