from fastapi import FastAPI, HTTPException, Depends, status
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from shared.database import get_database, Base, engine
from shared.auth import verify_token
from shared.models import ProjectCreate, ProjectResponse, TableResponse, RelationshipResponse, TableCreate, TableUpdate, RelationshipCreate, DiagramStateCreate, DiagramStateResponse
from services.project.models import Project, DiagramState
from services.schema.models import Table, Relationship
from typing import List
import uuid

app = FastAPI(title="Project Service", version="1.0.0")

# 사용자의 모든 프로젝트 목록을 조회하는 API
@app.get("/projects", response_model=List[ProjectResponse], summary="프로젝트 목록 조회", description="현재 사용자가 소유한 모든 DB 설계 프로젝트 목록을 반환합니다.")
async def get_projects(
    current_user: dict = Depends(verify_token), 
    db: AsyncSession = Depends(get_database)
):
    result = await db.execute(
        select(Project).where(Project.user_id == current_user["user_id"])
    )
    projects = result.scalars().all()
    
    return [
        ProjectResponse(
            id=project.id,
            name=project.name,
            db_type=project.db_type,
            tables=project.tables or [],
            relationships=project.relationships or [],
            created_at=project.created_at
        ) for project in projects
    ]

# 새로운 DB 설계 프로젝트를 생성하는 API
@app.post("/projects", response_model=ProjectResponse, summary="프로젝트 생성", description="새로운 데이터베이스 설계 프로젝트를 생성합니다. 프로젝트명과 DB 타입을 지정해야 합니다.")
async def create_project(
    project_data: ProjectCreate,
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_database)
):
    # 중복 프로젝트 이름 처리
    original_name = project_data.name
    final_name = original_name
    counter = 1
    
    while True:
        # 현재 사용자의 동일한 이름의 프로젝트가 있는지 확인
        result = await db.execute(
            select(Project).where(
                Project.user_id == current_user["user_id"],
                Project.name == final_name
            )
        )
        existing_project = result.scalar_one_or_none()
        
        if not existing_project:
            # 중복이 없으면 해당 이름 사용
            break
            
        # 중복이 있으면 숫자를 붙여서 새로운 이름 생성
        final_name = f"{original_name} ({counter})"
        counter += 1
    
    new_project = Project(
        id=str(uuid.uuid4()),
        name=final_name,
        db_type=project_data.db_type,
        user_id=current_user["user_id"],
        tables=[],
        relationships=[]
    )
    
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    
    return ProjectResponse(
        id=new_project.id,
        name=new_project.name,
        db_type=new_project.db_type,
        tables=new_project.tables or [],
        relationships=new_project.relationships or [],
        created_at=new_project.created_at
    )

# 특정 프로젝트의 상세 정보를 조회하는 API
@app.get("/projects/{project_id}", response_model=ProjectResponse, summary="프로젝트 상세 조회", description="지정된 ID의 프로젝트 상세 정보를 반환합니다. 테이블과 관계 정보를 포함합니다.")
async def get_project(
    project_id: str,
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_database)
):
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user["user_id"]
        )
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    return ProjectResponse(
        id=project.id,
        name=project.name,
        db_type=project.db_type,
        tables=project.tables or [],
        relationships=project.relationships or [],
        created_at=project.created_at
    )

# 프로젝트를 삭제하는 API
@app.delete("/projects/{project_id}", summary="프로젝트 삭제", description="지정된 ID의 프로젝트를 완전히 삭제합니다. 삭제된 데이터는 복구할 수 없습니다.")
async def delete_project(
    project_id: str,
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_database)
):
    print(f"🗑️ DELETE 요청 받음 - 프로젝트 ID: {project_id}, 사용자 ID: {current_user['user_id']}")
    
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user["user_id"]
        )
    )
    project = result.scalar_one_or_none()
    
    if not project:
        print(f"❌ 프로젝트를 찾을 수 없음 - ID: {project_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    print(f"✅ 프로젝트 삭제 중 - 이름: {project.name}")
    await db.delete(project)
    await db.commit()
    print(f"🎉 프로젝트 삭제 완료 - ID: {project_id}")
    
    return {"message": "Project deleted successfully"}

# 프로젝트의 모든 테이블 조회 API
@app.get("/projects/{project_id}/tables", response_model=List[TableResponse], summary="프로젝트 테이블 조회", description="지정된 프로젝트의 모든 테이블 목록을 반환합니다.")
async def get_project_tables(
    project_id: str,
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_database)
):
    # 프로젝트 소유권 확인
    project_result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user["user_id"]
        )
    )
    project = project_result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # 프로젝트의 테이블 목록 조회
    tables_result = await db.execute(
        select(Table).where(Table.project_id == project_id)
    )
    tables = tables_result.scalars().all()
    
    return [
        TableResponse(
            id=table.id,
            name=table.name,
            fields=table.fields,
            position=table.position,
            project_id=table.project_id
        ) for table in tables
    ]

# 프로젝트의 모든 관계 조회 API
@app.get("/projects/{project_id}/relationships", response_model=List[RelationshipResponse], summary="프로젝트 관계 조회", description="지정된 프로젝트의 모든 테이블 관계 목록을 반환합니다.")
async def get_project_relationships(
    project_id: str,
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_database)
):
    # 프로젝트 소유권 확인
    project_result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user["user_id"]
        )
    )
    project = project_result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # 프로젝트의 관계 목록 조회
    relationships_result = await db.execute(
        select(Relationship).where(Relationship.project_id == project_id)
    )
    relationships = relationships_result.scalars().all()
    
    return [
        RelationshipResponse(
            id=relationship.id,
            from_table=relationship.from_table,
            from_field=relationship.from_field,
            to_table=relationship.to_table,
            to_field=relationship.to_field,
            type=relationship.type,
            project_id=relationship.project_id
        ) for relationship in relationships
    ]

# 테이블 생성 API
@app.post("/projects/{project_id}/tables", response_model=TableResponse, summary="테이블 생성", description="지정된 프로젝트에 새로운 테이블을 생성합니다.")
async def create_table(
    project_id: str,
    table_data: TableCreate,
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_database)
):
    # 프로젝트 소유권 확인
    project_result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user["user_id"]
        )
    )
    project = project_result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # 같은 프로젝트 내에서 테이블 이름 중복 확인
    existing_table = await db.execute(
        select(Table).where(
            Table.project_id == project_id,
            Table.name == table_data.name
        )
    )
    if existing_table.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Table with name '{table_data.name}' already exists in this project"
        )
    
    # 필드 데이터를 JSON 형태로 변환
    fields_json = [field.model_dump() for field in table_data.fields]
    
    new_table = Table(
        id=str(uuid.uuid4()),
        name=table_data.name,
        project_id=project_id,
        fields=fields_json,
        position=table_data.position
    )
    
    db.add(new_table)
    await db.commit()
    await db.refresh(new_table)
    
    return TableResponse(
        id=new_table.id,
        name=new_table.name,
        fields=new_table.fields,
        position=new_table.position,
        project_id=new_table.project_id
    )

# 테이블 수정 API
@app.put("/projects/{project_id}/tables/{table_id}", response_model=TableResponse, summary="테이블 수정", description="지정된 테이블의 정보를 수정합니다.")
async def update_table(
    project_id: str,
    table_id: str,
    table_data: TableUpdate,
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_database)
):
    # 프로젝트 소유권 확인
    project_result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user["user_id"]
        )
    )
    project = project_result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # 테이블 존재 확인
    table_result = await db.execute(
        select(Table).where(
            Table.id == table_id,
            Table.project_id == project_id
        )
    )
    table = table_result.scalar_one_or_none()
    
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    
    # 테이블 이름 중복 확인 (이름이 변경되는 경우)
    if table_data.name and table_data.name != table.name:
        existing_table = await db.execute(
            select(Table).where(
                Table.project_id == project_id,
                Table.name == table_data.name,
                Table.id != table_id
            )
        )
        if existing_table.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Table with name '{table_data.name}' already exists in this project"
            )
    
    # 테이블 정보 업데이트
    if table_data.name is not None:
        table.name = table_data.name
    if table_data.fields is not None:
        table.fields = [field.model_dump() for field in table_data.fields]
    if table_data.position is not None:
        table.position = table_data.position
    
    await db.commit()
    await db.refresh(table)
    
    return TableResponse(
        id=table.id,
        name=table.name,
        fields=table.fields,
        position=table.position,
        project_id=table.project_id
    )

# 테이블 삭제 API
@app.delete("/projects/{project_id}/tables/{table_id}", summary="테이블 삭제", description="지정된 테이블을 삭제합니다. 관련된 관계도 함께 삭제됩니다.")
async def delete_table(
    project_id: str,
    table_id: str,
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_database)
):
    # 프로젝트 소유권 확인
    project_result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user["user_id"]
        )
    )
    project = project_result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # 테이블 존재 확인
    table_result = await db.execute(
        select(Table).where(
            Table.id == table_id,
            Table.project_id == project_id
        )
    )
    table = table_result.scalar_one_or_none()
    
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    
    # 해당 테이블과 연관된 관계들을 먼저 삭제
    relationships_to_delete = (await db.execute(
        select(Relationship).where(
            Relationship.project_id == project_id
        ).where(
            (Relationship.from_table == table.name) | 
            (Relationship.to_table == table.name)
        )
    )).scalars().all()
    
    for relationship in relationships_to_delete:
        await db.delete(relationship)
    
    # 테이블 삭제
    await db.delete(table)
    await db.commit()
    
    return {"message": f"Table '{table.name}' and related relationships deleted successfully"}

# 관계 생성 API
@app.post("/projects/{project_id}/relationships", response_model=RelationshipResponse, summary="관계 생성", description="지정된 프로젝트에 새로운 테이블 관계를 생성합니다.")
async def create_relationship(
    project_id: str,
    relationship_data: RelationshipCreate,
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_database)
):
    # 프로젝트 소유권 확인
    project_result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user["user_id"]
        )
    )
    project = project_result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # 관련된 테이블들이 프로젝트에 존재하는지 확인
    from_table = await db.execute(
        select(Table).where(
            Table.project_id == project_id,
            Table.name == relationship_data.from_table
        )
    )
    to_table = await db.execute(
        select(Table).where(
            Table.project_id == project_id,
            Table.name == relationship_data.to_table
        )
    )
    
    if not from_table.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"From table '{relationship_data.from_table}' not found in project"
        )
    
    if not to_table.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"To table '{relationship_data.to_table}' not found in project"
        )
    
    # 중복 관계 확인
    existing_relationship = await db.execute(
        select(Relationship).where(
            Relationship.project_id == project_id,
            Relationship.from_table == relationship_data.from_table,
            Relationship.from_field == relationship_data.from_field,
            Relationship.to_table == relationship_data.to_table,
            Relationship.to_field == relationship_data.to_field
        )
    )
    
    if existing_relationship.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Relationship already exists between these fields"
        )
    
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

# 관계 수정 API
@app.put("/projects/{project_id}/relationships/{relationship_id}", response_model=RelationshipResponse, summary="관계 수정", description="지정된 관계의 정보를 수정합니다.")
async def update_relationship(
    project_id: str,
    relationship_id: str,
    relationship_data: RelationshipCreate,
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_database)
):
    # 프로젝트 소유권 확인
    project_result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user["user_id"]
        )
    )
    project = project_result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # 관계 존재 확인
    relationship_result = await db.execute(
        select(Relationship).where(
            Relationship.id == relationship_id,
            Relationship.project_id == project_id
        )
    )
    relationship = relationship_result.scalar_one_or_none()
    
    if not relationship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relationship not found"
        )
    
    # 관련된 테이블들이 프로젝트에 존재하는지 확인
    from_table = await db.execute(
        select(Table).where(
            Table.project_id == project_id,
            Table.name == relationship_data.from_table
        )
    )
    to_table = await db.execute(
        select(Table).where(
            Table.project_id == project_id,
            Table.name == relationship_data.to_table
        )
    )
    
    if not from_table.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"From table '{relationship_data.from_table}' not found in project"
        )
    
    if not to_table.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"To table '{relationship_data.to_table}' not found in project"
        )
    
    # 중복 관계 확인 (자기 자신 제외)
    existing_relationship = await db.execute(
        select(Relationship).where(
            Relationship.project_id == project_id,
            Relationship.from_table == relationship_data.from_table,
            Relationship.from_field == relationship_data.from_field,
            Relationship.to_table == relationship_data.to_table,
            Relationship.to_field == relationship_data.to_field,
            Relationship.id != relationship_id
        )
    )
    
    if existing_relationship.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Relationship already exists between these fields"
        )
    
    # 관계 정보 업데이트
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

# 관계 삭제 API
@app.delete("/projects/{project_id}/relationships/{relationship_id}", summary="관계 삭제", description="지정된 관계를 삭제합니다.")
async def delete_relationship(
    project_id: str,
    relationship_id: str,
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_database)
):
    # 프로젝트 소유권 확인
    project_result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user["user_id"]
        )
    )
    project = project_result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # 관계 존재 확인
    relationship_result = await db.execute(
        select(Relationship).where(
            Relationship.id == relationship_id,
            Relationship.project_id == project_id
        )
    )
    relationship = relationship_result.scalar_one_or_none()
    
    if not relationship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relationship not found"
        )
    
    # 관계 삭제
    await db.delete(relationship)
    await db.commit()
    
    return {"message": f"Relationship between '{relationship.from_table}' and '{relationship.to_table}' deleted successfully"}

# 다이어그램 상태 조회 API
@app.get("/projects/{project_id}/diagram-state", response_model=DiagramStateResponse, summary="다이어그램 상태 조회", description="프로젝트의 다이어그램 뷰포트 상태를 조회합니다.")
async def get_diagram_state(
    project_id: str,
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_database)
):
    # 프로젝트 소유권 확인
    project_result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user["user_id"]
        )
    )
    project = project_result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # 다이어그램 상태 조회
    state_result = await db.execute(
        select(DiagramState).where(DiagramState.project_id == project_id)
    )
    diagram_state = state_result.scalar_one_or_none()
    
    if not diagram_state:
        # 다이어그램 상태가 없으면 기본값으로 생성
        diagram_state = DiagramState(
            id=str(uuid.uuid4()),
            project_id=project_id,
            view_offset={"x": 0, "y": 0},
            zoom_level=1.0
        )
        db.add(diagram_state)
        await db.commit()
        await db.refresh(diagram_state)
    
    return DiagramStateResponse(
        id=diagram_state.id,
        project_id=diagram_state.project_id,
        view_offset=diagram_state.view_offset,
        zoom_level=float(diagram_state.zoom_level),
        last_saved_at=diagram_state.last_saved_at,
        created_at=diagram_state.created_at
    )

# 다이어그램 상태 저장/업데이트 API
@app.put("/projects/{project_id}/diagram-state", response_model=DiagramStateResponse, summary="다이어그램 상태 저장", description="프로젝트의 다이어그램 뷰포트 상태를 저장합니다.")
async def save_diagram_state(
    project_id: str,
    state_data: DiagramStateCreate,
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_database)
):
    # 프로젝트 소유권 확인
    project_result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user["user_id"]
        )
    )
    project = project_result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # 기존 다이어그램 상태 확인
    state_result = await db.execute(
        select(DiagramState).where(DiagramState.project_id == project_id)
    )
    diagram_state = state_result.scalar_one_or_none()
    
    if diagram_state:
        # 기존 상태 업데이트
        diagram_state.view_offset = state_data.view_offset
        diagram_state.zoom_level = state_data.zoom_level
        diagram_state.last_saved_at = func.now()
    else:
        # 새로운 상태 생성
        diagram_state = DiagramState(
            id=str(uuid.uuid4()),
            project_id=project_id,
            view_offset=state_data.view_offset,
            zoom_level=state_data.zoom_level
        )
        db.add(diagram_state)
    
    await db.commit()
    await db.refresh(diagram_state)
    
    return DiagramStateResponse(
        id=diagram_state.id,
        project_id=diagram_state.project_id,
        view_offset=diagram_state.view_offset,
        zoom_level=float(diagram_state.zoom_level),
        last_saved_at=diagram_state.last_saved_at,
        created_at=diagram_state.created_at
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)