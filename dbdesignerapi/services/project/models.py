from sqlalchemy import Column, String, DateTime, Text, JSON, DECIMAL
from sqlalchemy.sql import func
from shared.database import Base
from config.settings import settings
import uuid

class Project(Base):
    __tablename__ = "tb_model_projects"
    __table_args__ = {"schema": settings.DB_SCHEMA}

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    db_type = Column(String(50), nullable=False)
    user_id = Column(String(36), nullable=False, index=True)
    tables = Column(JSON, default=list)
    relationships = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class DiagramState(Base):
    __tablename__ = "tb_model_diagram_states"
    __table_args__ = {"schema": settings.DB_SCHEMA}

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), nullable=False, unique=True, index=True)
    view_offset = Column(JSON, default={"x": 0, "y": 0})
    zoom_level = Column(DECIMAL(5, 2), default=1.0)
    last_saved_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())