import pytest
import uuid
from unittest.mock import AsyncMock, patch
from sqlalchemy import select

from app.models.room import Room
from app.models.participant import Participant
from app.core.storage import manager, host_token, ws_token
from app.core.security import hash_token
from app.services.migration_service import perform_host_migration
from app.services.room_service import create_new_room, approve_participant_join, kick_participant_from_room, update_room_details


@pytest.mark.asyncio
async def test_host_migration_promotes_oldest_participant(db_session, async_client):
    # 1. Create a room
    db_room, old_host_token = await create_new_room(db_session, room_name="Migration Test Room")
    room_code = db_room.room_code
    old_host_token_hash = db_room.host_token_hash

    # 2. Add two participants to the room
    manager.add_pending_request(room_code, "req-p1", "Participant 1")
    manager.add_pending_request(room_code, "req-p2", "Participant 2")
    p1_id, p1_ws_token = await approve_participant_join(db_session, db_room, "req-p1")
    p2_id, p2_ws_token = await approve_participant_join(db_session, db_room, "req-p2")

    # Set mock connections in connection manager
    mock_ws_p1 = AsyncMock()
    mock_ws_p2 = AsyncMock()
    manager.register_connection(p1_id, room_code, mock_ws_p1)
    manager.register_connection(p2_id, room_code, mock_ws_p2)

    # 3. Trigger perform_host_migration
    await perform_host_migration(db_session, room_code)

    # 4. Refresh room from database
    await db_session.refresh(db_room)

    # Room status should be active again
    assert db_room.status == "active"
    # New host token hash must be different from old
    assert db_room.host_token_hash != old_host_token_hash

    # 5. Check participants: p1 should be promoted to host
    res_p1 = await db_session.execute(select(Participant).where(Participant.id == uuid.UUID(p1_id)))
    p1 = res_p1.scalar_one()
    assert p1.role == "host"

    # 6. Verify credentials were sent to new host via WebSocket
    mock_ws_p1.send_json.assert_awaited()
    sent_payload = mock_ws_p1.send_json.call_args[0][0]
    assert sent_payload["type"] == "host_credentials"
    new_host_token = sent_payload["host_token"]
    assert hash_token(new_host_token) == db_room.host_token_hash

    # 7. Old host token should fail authorization on host endpoints
    res_old = await async_client.post(
        f"/api/v1/rooms/{room_code}/end",
        json={"save": False},
        headers={"x-host-token": old_host_token},
    )
    assert res_old.status_code == 403

    # 8. New host token should succeed
    res_new = await async_client.post(
        f"/api/v1/rooms/{room_code}/end",
        json={"save": False},
        headers={"x-host-token": new_host_token},
    )
    assert res_new.status_code == 200


@pytest.mark.asyncio
async def test_host_migration_closes_room_if_no_active_participants(db_session):
    # Create room with no participants besides initial host
    db_room, _ = await create_new_room(db_session, room_name="Empty Room")
    room_code = db_room.room_code

    with patch("app.services.room_service.close_room", new_callable=AsyncMock) as mock_close:
        await perform_host_migration(db_session, room_code)
        mock_close.assert_awaited_once()
