from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from config.settings import settings
import os

# SQL 로깅 설정 (환경변수로 제어)
sql_echo = os.getenv("SQL_ECHO", "true").lower() == "true"
engine = create_async_engine(settings.ASYNC_DATABASE_URL, echo=sql_echo)
SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_database():
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()