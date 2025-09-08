from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from shared.database import Base, engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup - 데이터베이스 테이블 생성
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown (if needed)

app = FastAPI(title="DB Designer Unified API", version="1.0.0", lifespan=lifespan)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인만 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 서비스 애플리케이션 임포트
from services.user.main import app as user_app
from services.project.main import app as project_app
from services.schema.main import app as schema_app
from services.ai.main import app as ai_app

# Sub-applications 마운트
app.mount("/api/user", user_app)
app.mount("/api/project", project_app) 
app.mount("/api/schema", schema_app)
app.mount("/api/ai", ai_app)

@app.get("/")
async def root():
    return {
        "message": "DB Designer Unified API",
        "version": "1.0.0",
        "services": {
            "user": "/api/user/docs",
            "project": "/api/project/docs", 
            "schema": "/api/schema/docs",
            "ai": "/api/ai/docs"
        }
    }

# 기존 프록시 코드 제거됨 - sub-applications로 대체

# 헬스 체크 엔드포인트
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "message": "DB Designer Unified API is running",
        "services": {
            "user": "integrated",
            "project": "integrated", 
            "schema": "integrated",
            "ai": "integrated"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)