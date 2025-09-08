from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.sql import func
from shared.database import Base
from config.settings import settings
import uuid

class User(Base):
    __tablename__ = "tb_model_users"
    __table_args__ = {"schema": settings.DB_SCHEMA}

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    nickname = Column(String(100), nullable=False)
    is_verified = Column(Boolean, default=False)
    verification_code = Column(String(6), nullable=True)
    password_reset_code = Column(String(6), nullable=True)
    password_reset_expires = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())