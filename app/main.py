from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.v1 import rooms, auth, users, dashboard
from .websockets.router import router as websocket_router

import os
from dotenv import load_dotenv
import asyncio
from contextlib import asynccontextmanager
from .services.ttl_sweep_service import start_sweep_task

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    sweep_task = start_sweep_task()
    yield
    sweep_task.cancel()
    try:
        await sweep_task
    except asyncio.CancelledError:
        pass

app = FastAPI(title="SyncRoom V2", lifespan=lifespan)

# CORS setup
cors_env = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174")
origins = [o.strip() for o in cors_env.split(",") if o.strip()]
if "*" in origins:
    origins = ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rooms.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1/dashboard")
app.include_router(websocket_router, prefix="/api/v1")

@app.get("/")
async def read_root():
    return {"Hello": "World"}