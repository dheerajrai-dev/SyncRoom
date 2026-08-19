import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
SQL_ECHO = os.getenv("SQL_ECHO", "false").lower() in ("true", "1", "yes")

engine = create_async_engine(DATABASE_URL, echo=SQL_ECHO)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db():
	async with AsyncSessionLocal() as session:
		yield session