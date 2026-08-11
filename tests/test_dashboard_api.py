import pytest
from httpx import AsyncClient
from datetime import datetime, timezone, timedelta
from app.models.room import Room
from app.models.user import User
from app.models.message import Message

import pytest_asyncio

@pytest_asyncio.fixture
async def users_and_tokens(db_session, create_user):
    import uuid
    uid = uuid.uuid4().hex[:8]
    user1, token1 = await create_user(f"dashuser1_{uid}", "DashPassw0rd")
    user2, token2 = await create_user(f"dashuser2_{uid}", "DashPassw0rd")
    return (user1, token1), (user2, token2)

@pytest_asyncio.fixture
async def setup_dashboard_rooms(db_session, users_and_tokens):
    (user1, token1), (user2, token2) = users_and_tokens
    
    import uuid
    uid = uuid.uuid4().hex[:4]
    
    # User 1 has 1 active, 2 archived rooms
    room1_active = Room(room_code=f"D1A{uid}", host_token_hash="hash", owner_user_id=user1.id, status="active", room_name="User1 Active")
    room1_archived1 = Room(room_code=f"D1B{uid}", host_token_hash="hash", owner_user_id=user1.id, status="archived", room_name="User1 Archived 1", archived_at=datetime.now(timezone.utc))
    room1_archived2 = Room(room_code=f"D1C{uid}", host_token_hash="hash", owner_user_id=user1.id, status="archived", room_name="User1 Archived 2", archived_at=datetime.now(timezone.utc) - timedelta(hours=1))
    
    # User 2 has 1 archived room
    room2_archived = Room(room_code=f"D2A{uid}", host_token_hash="hash", owner_user_id=user2.id, status="archived", room_name="User2 Archived")
    
    db_session.add_all([room1_active, room1_archived1, room1_archived2, room2_archived])
    await db_session.commit()
    
    # Add a message to user1's archived room
    msg1 = Message(room_id=room1_archived1.id, nickname="host", content="Hello Dashboard")
    db_session.add(msg1)
    await db_session.commit()
    
    return {
        "user1": {"user": user1, "token": token1, "archived1": room1_archived1, "archived2": room1_archived2, "active": room1_active},
        "user2": {"user": user2, "token": token2, "archived": room2_archived}
    }

@pytest.mark.asyncio
async def test_list_dashboard_rooms(async_client: AsyncClient, setup_dashboard_rooms):
    data1 = setup_dashboard_rooms["user1"]
    
    # Get user1's rooms
    res = await async_client.get("/api/v1/dashboard/rooms", headers={"Authorization": f"Bearer {data1['token']}"})
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2
    assert len(data["rooms"]) == 2
    
    # Verify only archived rooms are returned, ordered by archived_at descending
    assert data["rooms"][0]["id"] == str(data1["archived1"].id)
    assert data["rooms"][1]["id"] == str(data1["archived2"].id)
    
    # Check message counts
    assert data["rooms"][0]["message_count"] == 1
    assert data["rooms"][1]["message_count"] == 0

@pytest.mark.asyncio
async def test_get_dashboard_room_access_control(async_client: AsyncClient, setup_dashboard_rooms):
    data1 = setup_dashboard_rooms["user1"]
    data2 = setup_dashboard_rooms["user2"]
    
    # User 1 tries to access their own archived room
    res = await async_client.get(f"/api/v1/dashboard/rooms/{data1['archived1'].id}", headers={"Authorization": f"Bearer {data1['token']}"})
    assert res.status_code == 200
    assert res.json()["room_name"] == "User1 Archived 1"
    assert len(res.json()["messages"]) == 1
    assert res.json()["messages"][0]["content"] == "Hello Dashboard"
    
    # User 1 tries to access User 2's archived room
    res = await async_client.get(f"/api/v1/dashboard/rooms/{data2['archived'].id}", headers={"Authorization": f"Bearer {data1['token']}"})
    assert res.status_code == 404
    
    # User 1 tries to access their own active room (should be 404 because dashboard only serves archived rooms)
    res = await async_client.get(f"/api/v1/dashboard/rooms/{data1['active'].id}", headers={"Authorization": f"Bearer {data1['token']}"})
    assert res.status_code == 404

@pytest.mark.asyncio
async def test_delete_dashboard_room(async_client: AsyncClient, setup_dashboard_rooms, db_session):
    data1 = setup_dashboard_rooms["user1"]
    
    # User 1 deletes their room
    res = await async_client.delete(f"/api/v1/dashboard/rooms/{data1['archived1'].id}", headers={"Authorization": f"Bearer {data1['token']}"})
    assert res.status_code == 204
    
    # Verify it's gone
    res = await async_client.get(f"/api/v1/dashboard/rooms/{data1['archived1'].id}", headers={"Authorization": f"Bearer {data1['token']}"})
    assert res.status_code == 404

@pytest.mark.asyncio
async def test_export_dashboard_room(async_client: AsyncClient, setup_dashboard_rooms):
    data1 = setup_dashboard_rooms["user1"]
    room_id = str(data1["archived1"].id)
    
    # Export JSON
    res = await async_client.get(f"/api/v1/dashboard/rooms/{room_id}/export?format=json", headers={"Authorization": f"Bearer {data1['token']}"})
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/json"
    assert "attachment; filename" in res.headers["content-disposition"]
    data = res.json()
    assert data["room_name"] == "User1 Archived 1"
    assert data["messages"][0]["content"] == "Hello Dashboard"
    
    # Export TXT
    res = await async_client.get(f"/api/v1/dashboard/rooms/{room_id}/export?format=txt", headers={"Authorization": f"Bearer {data1['token']}"})
    assert res.status_code == 200
    assert res.headers["content-type"] == "text/plain; charset=utf-8"
    assert "User1 Archived 1" in res.text
    assert "Hello Dashboard" in res.text
