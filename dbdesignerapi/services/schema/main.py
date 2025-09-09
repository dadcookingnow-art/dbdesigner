from fastapi import FastAPI, HTTPException, Depends, status
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from shared.database import get_database, Base, engine
from shared.auth import verify_token
from shared.models import TableCreate, TableResponse, TableUpdate, RelationshipCreate, RelationshipResponse, TablePositionUpdate, IndexCreate
from services.schema.models import Table, Relationship
from typing import List
import uuid
import httpx

app = FastAPI(title="Schema Service", version="1.0.0")

async def verify_project_owner(project_id: str, user_id: str, db: AsyncSession):
    from services.project.models import Project
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == user_id
        )
    )
    project = result.scalar_one_or_none()
    return project is not None

@app.get("/projects/{project_id}/tables", response_model=List[TableResponse])
async def get_tables(
    project_id: str,
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_database)
):
    result = await db.execute(
        select(Table).where(Table.project_id == project_id)
    )
    tables = result.scalars().all()
    
    return [
        TableResponse(
            id=table.id,
            name=table.name,
            fields=table.fields,
            position=table.position,
            project_id=table.project_id
        ) for table in tables
    ]

@app.post("/projects/{project_id}/tables", response_model=TableResponse)
async def create_table(
    project_id: str,
    table_data: TableCreate,
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_database)
):
    fields_data = [
        {
            "name": field.name,
            "type": field.type,
            "isPrimaryKey": field.is_primary_key,
            "isRequired": field.is_required,
            "constraints": field.constraints,
            "isForeignKey": field.is_foreign_key,
            "referencedTable": field.referenced_table,
            "referencedField": field.referenced_field
        } for field in table_data.fields
    ]
    
    indexes_data = [
        {
            "name": index.name,
            "fields": index.fields,
            "type": index.type,
            "method": index.method
        } for index in (table_data.indexes or [])
    ]
    
    new_table = Table(
        id=str(uuid.uuid4()),
        name=table_data.name,
        project_id=project_id,
        fields=fields_data,
        indexes=indexes_data,
        position=table_data.position
    )
    
    db.add(new_table)
    await db.commit()
    await db.refresh(new_table)
    
    return TableResponse(
        id=new_table.id,
        name=new_table.name,
        fields=new_table.fields,
        indexes=new_table.indexes or [],
        position=new_table.position,
        project_id=new_table.project_id
    )

@app.put("/projects/{project_id}/tables/{table_id}", response_model=TableResponse)
async def update_table(
    project_id: str,
    table_id: str,
    table_data: TableUpdate,
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_database)
):
    result = await db.execute(
        select(Table).where(
            Table.id == table_id,
            Table.project_id == project_id
        )
    )
    table = result.scalar_one_or_none()
    
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found in this project"
        )
    
    if table_data.name is not None:
        table.name = table_data.name
    
    if table_data.fields is not None:
        fields_data = [
            {
                "name": field.name,
                "type": field.type,
                "isPrimaryKey": field.is_primary_key,
                "isRequired": field.is_required,
                "constraints": field.constraints,
                "isForeignKey": field.is_foreign_key,
                "referencedTable": field.referenced_table,
                "referencedField": field.referenced_field
            } for field in table_data.fields
        ]
        table.fields = fields_data
    
    if table_data.indexes is not None:
        indexes_data = [
            {
                "name": index.name,
                "fields": index.fields,
                "type": index.type,
                "method": index.method
            } for index in table_data.indexes
        ]
        table.indexes = indexes_data
    
    if table_data.position is not None:
        table.position = table_data.position
    
    await db.commit()
    await db.refresh(table)
    
    return TableResponse(
        id=table.id,
        name=table.name,
        fields=table.fields,
        indexes=table.indexes or [],
        position=table.position,
        project_id=table.project_id
    )

@app.delete("/projects/{project_id}/tables/{table_id}")
async def delete_table(
    project_id: str,
    table_id: str,
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_database)
):
    result = await db.execute(
        select(Table).where(
            Table.id == table_id,
            Table.project_id == project_id
        )
    )
    table = result.scalar_one_or_none()
    
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found in this project"
        )
    
    await db.delete(table)
    await db.commit()
    
    return {"message": "Table deleted successfully"}

@app.get("/projects/{project_id}/relationships", response_model=List[RelationshipResponse])
async def get_relationships(
    project_id: str,
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_database)
):
    result = await db.execute(
        select(Relationship).where(Relationship.project_id == project_id)
    )
    relationships = result.scalars().all()
    
    return [
        RelationshipResponse(
            id=rel.id,
            from_table=rel.from_table,
            from_field=rel.from_field,
            to_table=rel.to_table,
            to_field=rel.to_field,
            type=rel.type,
            project_id=rel.project_id
        ) for rel in relationships
    ]

@app.post("/projects/{project_id}/relationships", response_model=RelationshipResponse)
async def create_relationship(
    project_id: str,
    relationship_data: RelationshipCreate,
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_database)
):
    new_relationship = Relationship(
        id=str(uuid.uuid4()),
        project_id=project_id,
        from_table=relationship_data.from_table,
        from_field=relationship_data.from_field,
        to_table=relationship_data.to_table,
        to_field=relationship_data.to_field,
        type=relationship_data.type.value
    )
    
    db.add(new_relationship)
    await db.commit()
    await db.refresh(new_relationship)
    
    return RelationshipResponse(
        id=new_relationship.id,
        from_table=new_relationship.from_table,
        from_field=new_relationship.from_field,
        to_table=new_relationship.to_table,
        to_field=new_relationship.to_field,
        type=new_relationship.type,
        project_id=new_relationship.project_id
    )

@app.put("/projects/{project_id}/relationships/{relationship_id}", response_model=RelationshipResponse)
async def update_relationship(
    project_id: str,
    relationship_id: str,
    relationship_data: RelationshipCreate,
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_database)
):
    result = await db.execute(
        select(Relationship).where(
            Relationship.id == relationship_id,
            Relationship.project_id == project_id
        )
    )
    relationship = result.scalar_one_or_none()
    
    if not relationship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relationship not found in this project"
        )
    
    relationship.from_table = relationship_data.from_table
    relationship.from_field = relationship_data.from_field
    relationship.to_table = relationship_data.to_table
    relationship.to_field = relationship_data.to_field
    relationship.type = relationship_data.type.value
    
    await db.commit()
    await db.refresh(relationship)
    
    return RelationshipResponse(
        id=relationship.id,
        from_table=relationship.from_table,
        from_field=relationship.from_field,
        to_table=relationship.to_table,
        to_field=relationship.to_field,
        type=relationship.type,
        project_id=relationship.project_id
    )

@app.delete("/projects/{project_id}/relationships/{relationship_id}")
async def delete_relationship(
    project_id: str,
    relationship_id: str,
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_database)
):
    result = await db.execute(
        select(Relationship).where(
            Relationship.id == relationship_id,
            Relationship.project_id == project_id
        )
    )
    relationship = result.scalar_one_or_none()
    
    if not relationship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relationship not found in this project"
        )
    
    await db.delete(relationship)
    await db.commit()
    
    return {"message": "Relationship deleted successfully"}

# 테이블 위치 업데이트 API
@app.put("/projects/{project_id}/tables/{table_id}/position", response_model=TableResponse, summary="테이블 위치 업데이트", description="지정된 테이블의 위치를 업데이트합니다.")
async def update_table_position(
    project_id: str,
    table_id: str,
    position_data: TablePositionUpdate,
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_database)
):
    # 테이블 존재 및 프로젝트 소속 확인
    result = await db.execute(
        select(Table).where(
            Table.id == table_id,
            Table.project_id == project_id
        )
    )
    table = result.scalar_one_or_none()
    
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found in this project"
        )
    
    # 위치 업데이트
    table.position = position_data.position
    
    await db.commit()
    await db.refresh(table)
    
    return TableResponse(
        id=table.id,
        name=table.name,
        fields=table.fields,
        indexes=table.indexes or [],
        position=table.position,
        project_id=table.project_id
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)