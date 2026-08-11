import pytest
import pytest_asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.models import Base
from app.models.user import User
from sqlalchemy import select, text

load_dotenv()

# Use postgres for tests
DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_async_engine(DATABASE_URL)
TestingSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest_asyncio.fixture(autouse=True)
async def cleanup_db():
    yield
    async with TestingSessionLocal() as session:
        await session.execute(text("DELETE FROM users WHERE username = 'testuser'"))
        await session.commit()

@pytest.mark.asyncio
async def test_user_model_roundtrip():
    async with TestingSessionLocal() as session:
        # Create
        user = User(
            username="testuser",
            password_hash="hashedpass",
            display_name="Test User",
            avatar_url="http://example.com/avatar.png"
        )
        session.add(user)
        await session.commit()
        
        # Read
        result = await session.execute(select(User).where(User.username == "testuser"))
        db_user = result.scalar_one()
        
        assert db_user.username == "testuser"
        assert db_user.password_hash == "hashedpass"
        assert db_user.display_name == "Test User"
        assert db_user.avatar_url == "http://example.com/avatar.png"
        assert db_user.id is not None
        assert db_user.created_at is not None
        assert db_user.updated_at is not None
