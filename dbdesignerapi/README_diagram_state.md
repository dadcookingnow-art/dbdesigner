# 다이어그램 상태 저장 API 구현

UI에서 테이블 위치와 뷰포트 상태를 저장하여 새로고침 후에도 유지하는 서버 API를 구현했습니다.

## 구현 내용

### 1. 데이터베이스 스키마
- **테이블**: `tb_model_diagram_states`
- **저장 데이터**: 뷰포트 오프셋, 줌 레벨
- **기존 테이블**: `tb_model_tables`의 `position` 필드 활용

### 2. API 엔드포인트

#### 다이어그램 상태 관리
```
GET  /api/projects/{project_id}/diagram-state    # 상태 조회
PUT  /api/projects/{project_id}/diagram-state    # 상태 저장
```

#### 개별 테이블 위치 관리
```
PUT  /api/schema/projects/{project_id}/tables/{table_id}/position  # 테이블 위치 업데이트
```

### 3. 데이터 구조

#### DiagramState
```typescript
interface DiagramState {
  id: string
  project_id: string
  view_offset: { x: number, y: number }
  zoom_level: number
  last_saved_at: string
  created_at: string
}
```

#### TablePosition
```typescript
interface TablePosition {
  position: { x: number, y: number }
}
```

## 사용 방법

### 1. 데이터베이스 스키마 적용
```bash
# PostgreSQL에 연결하여 스키마 실행
psql -h localhost -U your_user -d postgres -f diagram_state_schema.sql
```

### 2. API 사용 예시

#### 다이어그램 상태 저장
```typescript
// 뷰포트 상태 저장
const response = await fetch('/api/projects/project-id/diagram-state', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    view_offset: { x: 100, y: 50 },
    zoom_level: 1.5
  })
});
```

#### 다이어그램 상태 조회
```typescript
// 프로젝트 로드 시 상태 복원
const response = await fetch('/api/projects/project-id/diagram-state', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
const diagramState = await response.json();
```

#### 테이블 위치 업데이트
```typescript
// 드래그 완료 시 위치 저장
const response = await fetch('/api/schema/projects/project-id/tables/table-id/position', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    position: { x: 200, y: 300 }
  })
});
```

### 3. 프론트엔드 통합 가이드

#### useProjectState.ts에 추가할 함수들

```typescript
// 다이어그램 상태 저장
export const saveDiagramState = async (projectId: string, state: DiagramStateCreate) => {
  const response = await apiClient.put(`/projects/${projectId}/diagram-state`, state);
  return response.data;
};

// 다이어그램 상태 로드
export const loadDiagramState = async (projectId: string) => {
  const response = await apiClient.get(`/projects/${projectId}/diagram-state`);
  return response.data;
};

// 테이블 위치 업데이트
export const updateTablePosition = async (projectId: string, tableId: string, position: {x: number, y: number}) => {
  const response = await apiClient.put(`/schema/projects/${projectId}/tables/${tableId}/position`, {
    position
  });
  return response.data;
};
```

#### 저장 타이밍 구현 (debounce 적용)

```typescript
import { debounce } from 'lodash';

// 뷰포트 상태 저장 (debounce 적용)
const debouncedSaveDiagramState = debounce(async (projectId: string, viewOffset: {x: number, y: number}, zoomLevel: number) => {
  try {
    await saveDiagramState(projectId, {
      view_offset: viewOffset,
      zoom_level: zoomLevel
    });
  } catch (error) {
    console.error('Failed to save diagram state:', error);
  }
}, 1000);

// 테이블 위치 저장 (debounce 적용)
const debouncedSaveTablePosition = debounce(async (projectId: string, tableId: string, position: {x: number, y: number}) => {
  try {
    await updateTablePosition(projectId, tableId, position);
  } catch (error) {
    console.error('Failed to save table position:', error);
  }
}, 500);
```

## 수정된 파일들

1. **dbdesignerapi/diagram_state_schema.sql** - 새 스키마
2. **services/project/models.py** - DiagramState 모델 추가
3. **services/project/main.py** - 다이어그램 상태 API 추가
4. **services/schema/main.py** - 테이블 위치 API 추가
5. **shared/models.py** - Pydantic 모델 추가
6. **gateway/main.py** - 라우팅 추가

## 특징

- **자동 생성**: 다이어그램 상태가 없으면 기본값으로 생성
- **프로젝트별 관리**: 각 프로젝트마다 독립적인 다이어그램 상태
- **실시간 저장**: debounce를 통한 효율적인 자동 저장
- **권한 확인**: 프로젝트 소유권 검증
- **에러 처리**: 적절한 HTTP 상태 코드와 메시지 제공