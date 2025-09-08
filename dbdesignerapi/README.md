# DB Designer Microservices API

FastAPI 기반 DB Designer 마이크로서비스 시스템

## 시스템 아키텍처

```
                                                             
                     API Gateway (8000)                     
                                                          
                       CORS, Auth,                        
                       Rate Limiting                      
                                                          
                         ↓                                   
                          
                         ↓               
                                        
         ↓             ↓            ↓            ↓     
  User Service     Project   Schema Service AI Service 
     (8001)        Service      (8003)        (8004)   
                    (8002)                             
• 회원가입/로그인   • 프로젝트 • 테이블 관리    • AI 채팅  
• 사용자 인증        CRUD    • 관계 설정      • 추천   
• JWT 토큰        • 메타데이터   • ERD 생성        기능     
                                                       
                                                       
                         ↓               ↓              
                                         
                         ↓               ↓              
                       공통 모듈 (shared/)             
                • Database (PostgreSQL + SQLAlchemy)  
                • Redis Client                        
                • Auth (JWT)                          
                • Pydantic Models                     
                                                      
```

## 빠른 시작 가이드

### 1. 환경 설정

```bash
# Anaconda 가상환경 생성
conda create -n dbdesigner-api python=3.11 -y
conda activate dbdesigner-api

# 패키지 설치
pip install fastapi==0.104.1 uvicorn[standard]==0.24.0 pydantic==2.5.0
pip install sqlalchemy==2.0.23 alembic==1.13.0 asyncpg==0.29.0
pip install redis==5.0.1 python-jose[cryptography]==3.3.0 passlib[bcrypt]==1.7.4
pip install python-multipart==0.0.6 httpx==0.25.2 python-dotenv==1.0.0 email-validator==2.1.0
pip install pytest==7.4.3 pytest-asyncio==0.21.1
```

### 2. 데이터베이스 설정

PostgreSQL과 Redis를 설치하고 실행:

```sql
-- PostgreSQL에 데이터베이스 생성
CREATE DATABASE dbdesigner;
```

### 3. 환경변수 설정

프로젝트 루트에 `.env` 파일 생성:

```bash
# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=1004!
DB_SCHEMA=public2

# Redis 설정
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# JWT 설정
JWT_SECRET=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=30
```

### 4. 데이터베이스 초기화

```bash
# 기존 테이블 제거 (필요한 경우)
psql -U postgres -d postgres -f remove_old_tables.sql

# 새 테이블 생성
psql -U postgres -d postgres -f database_setup.sql
```

### 5. 서비스 실행

Windows에서 모든 서비스를 한 번에 실행:

```bash
start_services.bat
```

개별 실행:

```bash
# User Service
run_user.bat

# Project Service  
run_project.bat

# Schema Service
run_schema.bat

# AI Service
run_ai.bat

# API Gateway
run_gateway.bat
```

## API 사용법 가이드

### 서비스 포트
- **User Service**: http://localhost:8001
- **Project Service**: http://localhost:8002
- **Schema Service**: http://localhost:8003
- **AI Service**: http://localhost:8004
- **Gateway**: http://localhost:8000

### 1. 사용자 인증

#### 회원가입
```bash
curl -X POST "http://localhost:8001/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "nickname": "사용자1"
  }'
```

#### 이메일 인증
```bash
curl -X POST "http://localhost:8001/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "123456"
  }'
```

#### 로그인
```bash
curl -X POST "http://localhost:8001/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

#### 사용자 정보 조회
```bash
curl -X GET "http://localhost:8001/auth/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. 프로젝트 관리

#### 프로젝트 생성
```bash
curl -X POST "http://localhost:8002/projects" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "E-commerce DB",
    "db_type": "postgresql"
  }'
```

#### 프로젝트 목록 조회
```bash
curl -X GET "http://localhost:8002/projects" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 특정 프로젝트 조회
```bash
curl -X GET "http://localhost:8002/projects/{project_id}" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 프로젝트 삭제
```bash
curl -X DELETE "http://localhost:8002/projects/{project_id}" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. 테이블 관리

#### 테이블 생성
```bash
curl -X POST "http://localhost:8003/projects/{project_id}/tables" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "users",
    "fields": [
      {
        "name": "id",
        "type": "INTEGER",
        "isPrimaryKey": true,
        "isRequired": true
      },
      {
        "name": "email",
        "type": "VARCHAR(255)",
        "isPrimaryKey": false,
        "isRequired": true
      },
      {
        "name": "name",
        "type": "VARCHAR(100)",
        "isPrimaryKey": false,
        "isRequired": true
      }
    ],
    "position": {"x": 100, "y": 100}
  }'
```

#### 테이블 목록 조회
```bash
curl -X GET "http://localhost:8003/projects/{project_id}/tables" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 테이블 수정
```bash
curl -X PUT "http://localhost:8003/tables/{table_id}" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "users",
    "fields": [
      {
        "name": "id",
        "type": "INTEGER",
        "isPrimaryKey": true,
        "isRequired": true
      },
      {
        "name": "email",
        "type": "VARCHAR(255)",
        "isPrimaryKey": false,
        "isRequired": true
      },
      {
        "name": "name",
        "type": "VARCHAR(100)",
        "isPrimaryKey": false,
        "isRequired": true
      },
      {
        "name": "created_at",
        "type": "TIMESTAMP",
        "isPrimaryKey": false,
        "isRequired": true
      }
    ],
    "position": {"x": 150, "y": 150}
  }'
```

#### 테이블 삭제
```bash
curl -X DELETE "http://localhost:8003/tables/{table_id}" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. 관계 관리

#### 관계 생성
```bash
curl -X POST "http://localhost:8003/projects/{project_id}/relationships" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "from_table": "users",
    "from_field": "id",
    "to_table": "posts",
    "to_field": "user_id",
    "type": "1:N"
  }'
```

#### 관계 목록 조회
```bash
curl -X GET "http://localhost:8003/projects/{project_id}/relationships" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 관계 삭제
```bash
curl -X DELETE "http://localhost:8003/relationships/{relationship_id}" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. AI 채팅

#### AI 채팅으로 테이블 추천받기
```bash
curl -X POST "http://localhost:8004/chat" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "your_project_id",
    "message": "사용자와 게시글, 댓글 테이블을 만들어주세요"
  }'
```

#### 채팅 히스토리 조회
```bash
curl -X GET "http://localhost:8004/projects/{project_id}/chat-history" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 채팅 히스토리 삭제
```bash
curl -X DELETE "http://localhost:8004/projects/{project_id}/chat-history" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## API 엔드포인트 요약

### User Service (포트 8001)
- **POST** `/auth/register` - 사용자 회원가입
- **POST** `/auth/verify` - 이메일 인증
- **POST** `/auth/login` - 로그인
- **GET** `/auth/me` - 현재 사용자 정보 조회

### Project Service (포트 8002)
- **GET** `/projects` - 프로젝트 목록 조회
- **POST** `/projects` - 새 프로젝트 생성
- **GET** `/projects/{project_id}` - 프로젝트 상세 조회
- **DELETE** `/projects/{project_id}` - 프로젝트 삭제

### Schema Service (포트 8003)
- **GET** `/projects/{project_id}/tables` - 테이블 목록 조회
- **POST** `/projects/{project_id}/tables` - 새 테이블 생성
- **PUT** `/tables/{table_id}` - 테이블 수정
- **DELETE** `/tables/{table_id}` - 테이블 삭제
- **GET** `/projects/{project_id}/relationships` - 관계 목록 조회
- **POST** `/projects/{project_id}/relationships` - 새 관계 생성
- **DELETE** `/relationships/{relationship_id}` - 관계 삭제

### AI Service (포트 8004)
- **POST** `/chat` - AI 채팅 및 테이블 추천
- **GET** `/projects/{project_id}/chat-history` - 채팅 히스토리 조회
- **DELETE** `/projects/{project_id}/chat-history` - 채팅 히스토리 삭제

## 주요 기능 특징

### 사용자 관리
- JWT 기반 인증 시스템
- 이메일 인증 절차 (Redis 저장)
- 비밀번호 해시화 (bcrypt)

### 프로젝트 관리
- 다중 사용자 프로젝트 생성/관리
- 다양한 데이터베이스 타입 지원
- JSON 기반 메타데이터 저장

### 데이터베이스 설계
- 테이블 생성/수정/삭제
- 관계 설정 (1:1, 1:N, N:N 등)
- 테이블 위치 정보 저장
- 시각적 ERD 생성을 위한 데이터

### AI 기능 통합
- 자연어 기반 테이블 구조 생성
- 채팅형 인터페이스 제공
- 채팅 히스토리 관리

## 개발 도구

### API 문서화
각 서비스의 Swagger 문서:
- User Service: http://localhost:8001/docs
- Project Service: http://localhost:8002/docs
- Schema Service: http://localhost:8003/docs
- AI Service: http://localhost:8004/docs
- Gateway: http://localhost:8000/docs

### 헬스 체크
```http
GET /health  # 각 서비스의 상태 확인
```

## 프로젝트 구조

```
dbdesignerapi/
├── shared/                 # 공통 모듈
│   ├── __init__.py
│   ├── database.py        # SQLAlchemy 설정
│   ├── redis_client.py    # Redis 클라이언트
│   ├── auth.py           # JWT 인증
│   └── models.py         # Pydantic 모델
├── services/
│   ├── user/             # 사용자 서비스
│   │   ├── __init__.py
│   │   ├── main.py
│   │   └── models.py
│   ├── project/          # 프로젝트 서비스
│   │   ├── __init__.py
│   │   ├── main.py
│   │   └── models.py
│   ├── schema/           # 스키마 서비스
│   │   ├── __init__.py
│   │   ├── main.py
│   │   └── models.py
│   └── ai/              # AI 서비스
│       ├── __init__.py
│       └── main.py
├── gateway/              # API 게이트웨이
│   ├── __init__.py
│   └── main.py
├── config/              # 설정
│   ├── __init__.py
│   └── settings.py
├── database_setup.sql   # DB 초기화 스크립트
├── start_services.bat   # Windows 실행 스크립트
├── run_*.bat           # 개별 서비스 실행 스크립트
└── README.md           # 프로젝트 문서
```

## 향후 개발 계획

1. **실제 LLM 연동** - OpenAI API, Claude API 통합
2. **실시간 협업** - WebSocket을 통한 실시간 편집
3. **SQL 생성** - 설계된 구조를 SQL DDL로 변환
4. **이메일 서비스** - 실제 SMTP 기반 인증
5. **모니터링** - Prometheus, Grafana 통합
6. **컨테이너화** - Docker, Kubernetes 배포

## 라이센스

MIT License