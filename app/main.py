from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from .api.v1 import rooms, auth, users, dashboard
from .websockets.router import router as websocket_router
from .core.rate_limiter import limiter

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
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS setup
cors_env = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174,http://localhost:3000")
origins = [o.strip() for o in cors_env.split(",") if o.strip()]

if "*" in origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
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
    return {"status": "ok", "app": "SyncRoom V2"}