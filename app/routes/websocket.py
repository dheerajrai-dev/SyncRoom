from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import ValidationError
from ..model import DeniedRequest, chat_Message
from ..storage import (
    build_room_state,
    rooms,
    broadcast_message,
    is_reconnect_expired,
    process_chat_message,
)

router = APIRouter()

# Simple echo websocket for testing
@router.websocket("/ws/echos")
async def websocket_echo(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Message text was: {data}")
    except WebSocketDisconnect:
        print("Client disconnected")

# WebSocket connection for a specific room
@router.websocket("/ws/rooms/{room_code}")
async def websocket_room(websocket: WebSocket, room_code: str, token: str):
    room = rooms.get(room_code)

    # If room does not exist, close the connection
    if room is None:
        await websocket.accept()
        await websocket.send_text("Room not found")
        await websocket.close()
        return

    # connecting host
    if room.get("host_token") == token:
        room["host_connection"]["websocket"] = websocket
        room["host_connection"]["disconnected_at"] = None
        await websocket.accept()
        await websocket.send_json(build_room_state(room))

        try:
            while True:
                data = await websocket.receive_text()
                try:
                    incoming = chat_Message.model_validate_json(data)
                    await process_chat_message(
                        incoming.content,
                        room,
                        sender_id="host",
                        username="Host",
                    )
                except ValidationError:
                    await websocket.send_text("Invalid message format")
        except WebSocketDisconnect:
            host_connection = room["host_connection"]
            if host_connection["websocket"] == websocket:
                host_connection["websocket"] = None
                host_connection["disconnected_at"] = datetime.now(timezone.utc)

                await broadcast_message(
                    {
                        "type": "host_disconnected",
                        "username": "Host"
                    },
                    room
                )
        return

    # Match participant using websocket token
    matched_participant = None
    for pid, pdata in room["participants"].items():
        if pdata.get("ws_token") == token:
            matched_participant = pdata
            matched_participant["participant_id"] = pid
            break

    # If token is invalid, close the connection
    if matched_participant is None:
        await websocket.accept()
        await websocket.send_text("Invalid WebSocket token")
        await websocket.close()
        return

    # Fresh connection, no previous disconnection
    if matched_participant["disconnected_at"] is None:
        matched_participant["websocket"] = websocket
        matched_participant["username"] = matched_participant.get("username", "Unknown")
        await websocket.accept()
        await websocket.send_json(build_room_state(room))

        # Broadcast message to all connected participants
        await broadcast_message(
            {
                "type": "participant_connected",
                "username": matched_participant["username"]
            },
            room,
            exclude_participant_id=matched_participant["participant_id"]
        )

    # Reconnection scenario
    elif not is_reconnect_expired(matched_participant["disconnected_at"]):

        matched_participant["websocket"] = websocket
        matched_participant["disconnected_at"] = None

        await websocket.accept()
        await websocket.send_json(build_room_state(room))

        await broadcast_message(
            {
                "type": "participant_reconnected",
                "username": matched_participant["username"]
            },
            room,
            exclude_participant_id=matched_participant["participant_id"]
        )

    # Reconnection expired, treat as new connection
    else:
        await websocket.accept()
        await websocket.send_text(
            "Reconnect window expired. Please join again."
        )
        await websocket.close()
        return

    try:
        while True:
            data = await websocket.receive_text()
            try:
                incoming = chat_Message.model_validate_json(data)
                await process_chat_message(
                    incoming.content,
                    room,
                    sender_id=matched_participant["participant_id"],
                    username=matched_participant["username"],
                )
            except ValidationError:
                await websocket.send_text("Invalid message format")
    except WebSocketDisconnect:
        matched_participant["websocket"] = None
        matched_participant["disconnected_at"] = datetime.now(timezone.utc)

        await broadcast_message(
            {
                "type": "participant_disconnected",
                "username": matched_participant["username"]
            },
            room,
            exclude_participant_id=matched_participant["participant_id"]
        )