from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    nickname: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class VerificationRequest(BaseModel):
    email: EmailStr
    code: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    email: EmailStr
    reset_code: str
    new_password: str

class UserResponse(BaseModel):
    id: str
    email: str
    nickname: str
    is_verified: bool

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ProjectCreate(BaseModel):
    name: str
    db_type: str

class ProjectResponse(BaseModel):
    id: str
    name: str
    db_type: str
    tables: List[Dict[str, Any]] = []
    relationships: List[Dict[str, Any]] = []
    created_at: datetime

class IndexType(str, Enum):
    INDEX = "INDEX"
    UNIQUE = "UNIQUE"
    FULLTEXT = "FULLTEXT"
    PRIMARY = "PRIMARY"

class IndexMethod(str, Enum):
    BTREE = "BTREE"
    HASH = "HASH"
    FULLTEXT = "FULLTEXT"

class IndexCreate(BaseModel):
    name: str
    fields: List[str]
    type: IndexType = IndexType.INDEX
    method: Optional[IndexMethod] = IndexMethod.BTREE

class FieldCreate(BaseModel):
    name: str
    type: str
    is_primary_key: bool = False
    is_required: bool = True
    constraints: Optional[str] = None
    is_foreign_key: bool = False
    referenced_table: Optional[str] = None
    referenced_field: Optional[str] = None

class TableCreate(BaseModel):
    name: str
    fields: List[FieldCreate]
    indexes: Optional[List[IndexCreate]] = []
    position: Dict[str, float] = {"x": 0, "y": 0}

class TableUpdate(BaseModel):
    name: Optional[str] = None
    fields: Optional[List[FieldCreate]] = None
    indexes: Optional[List[IndexCreate]] = None
    position: Optional[Dict[str, float]] = None

class TableResponse(BaseModel):
    id: str
    name: str
    fields: List[Dict[str, Any]]
    indexes: List[Dict[str, Any]] = []
    position: Dict[str, float]
    project_id: str

class RelationshipType(str, Enum):
    ONE_TO_ONE = "1:1"
    ONE_TO_MANY = "1:N"
    MANY_TO_ONE = "N:1"
    MANY_TO_MANY = "N:N"
    ZERO_TO_ONE = "0:1"
    ONE_TO_ZERO = "1:0"

class RelationshipCreate(BaseModel):
    from_table: str
    from_field: str
    to_table: str
    to_field: str
    type: RelationshipType

class RelationshipResponse(BaseModel):
    id: str
    from_table: str
    from_field: str
    to_table: str
    to_field: str
    type: str
    project_id: str

class ChatMessage(BaseModel):
    role: str = "user"
    content: str

class ChatRequest(BaseModel):
    message: str
    project_id: str

class ChatResponse(BaseModel):
    role: str = "assistant"
    content: str
    suggested_tables: Optional[List[Dict[str, Any]]] = None

class DiagramStateCreate(BaseModel):
    view_offset: Dict[str, float] = {"x": 0, "y": 0}
    zoom_level: float = 1.0

class DiagramStateResponse(BaseModel):
    id: str
    project_id: str
    view_offset: Dict[str, float]
    zoom_level: float
    last_saved_at: datetime
    created_at: datetime

class TablePositionUpdate(BaseModel):
    position: Dict[str, float]