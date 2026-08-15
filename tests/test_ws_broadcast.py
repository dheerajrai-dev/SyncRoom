import pytest
from unittest.mock import AsyncMock, patch
from app.core.storage import (
    process_chat_message,
    manager,
    ConnectionManager,
)
import uuid

@pytest.mark.asyncio
async def test_process_chat_message_broadcasts_to_all_participants():
    room_code = f"RM{uuid.uuid4().hex[:4].upper()}"
    participant_id = str(uuid.uuid4())
    username = "TestUser"
    content = "Hello all"

    # Mock manager.broadcast_to_room to verify arguments
    with patch.object(manager, "broadcast_to_room", new_callable=AsyncMock) as mock_broadcast:
        result = await process_chat_message(
            participant_db_id=participant_id,
            username=username,
            content=content,
            room_code=room_code,
        )

        # Result must be a chat_message dictionary with canonical fields
        assert result["type"] == "chat_message"
        assert result["content"] == content
        assert result["nickname"] == username
        assert result["participant_id"] == participant_id
        assert "message_id" in result
        assert "sent_at" in result

        # In-memory storage must contain the message
        in_memory = manager.get_messages(room_code)
        assert len(in_memory) == 1
        assert in_memory[0]["message_id"] == result["message_id"]

        # broadcast_to_room must be called for the room_code with the exact message_record, WITHOUT excluding the sender!
        mock_broadcast.assert_awaited_once_with(room_code, result)


@pytest.mark.asyncio
async def test_edit_and_delete_message_storage():
    test_manager = ConnectionManager()
    room_code = "TESTROOM"
    msg_id = str(uuid.uuid4())
    
    test_manager.add_message(room_code, {
        "message_id": msg_id,
        "participant_id": "pid-1",
        "nickname": "Alice",
        "content": "Original message",
        "sent_at": "2026-08-15T00:00:00Z"
    })

    assert len(test_manager.get_messages(room_code)) == 1
    assert test_manager.get_messages(room_code)[0]["content"] == "Original message"

    # Edit message
    edited = test_manager.edit_message(room_code, msg_id, "Edited message")
    assert edited is True
    assert test_manager.get_messages(room_code)[0]["content"] == "Edited message"

    # Delete message
    deleted = test_manager.delete_message(room_code, msg_id)
    assert deleted is True
    assert len(test_manager.get_messages(room_code)) == 0
