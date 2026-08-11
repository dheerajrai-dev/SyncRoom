import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
import uuid
from app.main import app
from app.db.session import get_db
from tests.db_test_utils import TestingSessionLocal
from app.core.auth import hash_password
from app.models.user import User
from app.core.auth import create_access_token
from sqlalchemy import text

@pytest_asyncio.fixture
async def db_session():
    async with TestingSessionLocal() as session:
        yield session

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        yield client

@pytest_asyncio.fixture(autouse=True)
async def override_get_db(db_session):
    async def _override_get_db():
        yield db_session
    app.dependency_overrides[get_db] = _override_get_db
    yield
    app.dependency_overrides.clear()

@pytest_asyncio.fixture
async def create_user(db_session):
    async def _create_user(username: str, password: str = "TestPassw0rd!"):
        user_id = uuid.uuid4()
        user = User(
            id=user_id,
            username=username,
            password_hash=hash_password(password),
            display_name=username
        )
        db_session.add(user)
        await db_session.commit()
        
        token = create_access_token(str(user_id))
        return user, token
        
    return _create_user
