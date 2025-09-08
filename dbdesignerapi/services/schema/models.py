from sqlalchemy import Column, String, DateTime, JSON, Text
from sqlalchemy.sql import func
from shared.database import Base
from config.settings import settings
import uuid

class Table(Base):
    __tablename__ = "tb_model_tables"
    __table_args__ = {"schema": settings.DB_SCHEMA}

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    project_id = Column(String(36), nullable=False, index=True)
    fields = Column(JSON, nullable=False)
    indexes = Column(JSON, default=[])
    position = Column(JSON, default={"x": 0, "y": 0})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Relationship(Base):
    __tablename__ = "tb_model_relationships"
    __table_args__ = {"schema": settings.DB_SCHEMA}

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), nullable=False, index=True)
    from_table = Column(String(255), nullable=False)
    from_field = Column(String(255), nullable=False)
    to_table = Column(String(255), nullable=False)
    to_field = Column(String(255), nullable=False)
    type = Column(String(10), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())