from fastapi import FastAPI
from .routes.rooms import router as rooms_router
from .routes.websocket import router as websocket_router

app = FastAPI()

app.include_router(rooms_router)
app.include_router(websocket_router)

@app.get("/")
async def read_root():
    return {"Hello": "World"}