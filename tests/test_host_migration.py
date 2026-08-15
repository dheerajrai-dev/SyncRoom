import asyncio
import httpx
import websockets
import subprocess
import time
import json
import os

async def main():
    print("Starting server...")
    env = os.environ.copy()
    env["PYTHONPATH"] = "."
    env["HOST_GRACE_PERIOD"] = "1"
    server_process = subprocess.Popen([r".venv\Scripts\python", "-m", "uvicorn", "app.main:app", "--port", "8005"], env=env)
    
    # Wait for server to start
    time.sleep(3)
    
    try:
        async with httpx.AsyncClient(base_url="http://localhost:8005") as client:
            print("Creating room...")
            res = await client.post("/api/v1/rooms", json={"name": "Migration Test"})
            assert res.status_code == 201
            data = res.json()
            room_code = data["code"]
            old_host_token = data["host_token"]
            old_ws_token = old_host_token
            
            print(f"Room created: {room_code}")
            
            print("Join Participant B...")
            res_b = await client.post(f"/api/v1/rooms/{room_code}/join", json={"nickname": "Participant B"})
            assert res_b.status_code == 202
            req_id = res_b.json()["participant_id"]
            
            print("Host approves B...")
            res_app = await client.post(f"/api/v1/rooms/{room_code}/approve", json={"participant_id": req_id}, headers={"x-host-token": old_host_token})
            assert res_app.status_code == 200
            
            print("Get B's token...")
            res_status = await client.get(f"/api/v1/rooms/{room_code}/join/{req_id}/status")
            assert res_status.status_code == 200
            b_ws_token = res_status.json()["ws_token"]
            
            print("Connecting Participant B...")
            async with websockets.connect(f"ws://localhost:8005/api/v1/ws/{room_code}?token={b_ws_token}") as ws_b:
                state_str = await ws_b.recv()
                print(f"B received: {state_str}")
                state = json.loads(state_str)
                assert state["type"] == "room_state"
                
                print("Connecting Host A...")
                async with websockets.connect(f"ws://localhost:8005/api/v1/ws/{room_code}?token={old_ws_token}") as ws_a:
                    state_a_str = await ws_a.recv()
                    state_a = json.loads(state_a_str)
                    assert state_a["type"] == "room_state"
                    print("Host A connected. Now Host A will disconnect.")
                    
                # Host A disconnected
                print("Host A disconnected.")
                
                # B should receive participant_joined for A and B
                while True:
                    msg_str = await ws_b.recv()
                    msg = json.loads(msg_str)
                    if msg["type"] == "host_disconnected_grace_started":
                        break
                
                print("Grace period started.")
                
                # Wait for migration (HOST_GRACE_PERIOD=1)
                await asyncio.sleep(1.5)
                
                # B should receive host_migrated
                msg_str = await ws_b.recv()
                msg = json.loads(msg_str)
                assert msg["type"] == "host_migrated"
                print("Host migrated event received!")
                
                # B should receive credentials
                msg_str = await ws_b.recv()
                msg = json.loads(msg_str)
                assert msg["type"] == "host_credentials"
                new_host_token = msg["host_token"]
                print("Credentials received!")
                
            print("Attempting to use old_host_token to close the room...")
            res_fail = await client.post(f"/api/v1/rooms/{room_code}/end", json={"save": False}, headers={"x-host-token": old_host_token})
            assert res_fail.status_code == 403
            
            print("Attempting to use new_host_token to close the room...")
            res_success = await client.post(f"/api/v1/rooms/{room_code}/end", json={"save": False}, headers={"x-host-token": new_host_token})
            assert res_success.status_code == 200
            print("Room closed successfully with new token!")
            print("ALL TESTS PASSED!")
            
    finally:
        server_process.terminate()

if __name__ == "__main__":
    asyncio.run(main())
