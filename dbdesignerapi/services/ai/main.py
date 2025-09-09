from fastapi import FastAPI, HTTPException, Depends, status
from shared.auth import verify_token
from shared.models import ChatRequest, ChatResponse
from shared.redis_client import redis_client
from .gemini_service import get_gemini_service
import json
import uuid
from typing import List, Dict, Any

app = FastAPI(title="AI Service", version="1.0.0")

async def parse_chat_to_tables(message: str) -> List[Dict[str, Any]]:
    """
    AI 채팅 메시지를 분석해서 테이블 구조를 생성하는 함수
    Gemini API를 사용하여 지능적인 테이블 구조 생성
    """
    try:
        gemini_service = get_gemini_service()
        return await gemini_service.parse_message_to_tables(message)
    except Exception as e:
        print(f"Gemini 서비스 초기화 실패: {str(e)}")
        # Fallback to simple keyword matching
        return _fallback_keyword_matching(message)

def _fallback_keyword_matching(message: str) -> List[Dict[str, Any]]:
    """
    Gemini 서비스 실패 시 폴백 키워드 매칭
    """
    message_lower = message.lower()
    suggested_tables = []
    
    if "사용자" in message or "user" in message_lower:
        suggested_tables.append({
            "name": "users",
            "fields": [
                {"name": "id", "type": "INTEGER", "isPrimaryKey": True, "isRequired": True},
                {"name": "email", "type": "VARCHAR(255)", "isPrimaryKey": False, "isRequired": True},
                {"name": "name", "type": "VARCHAR(100)", "isPrimaryKey": False, "isRequired": True},
                {"name": "created_at", "type": "TIMESTAMP", "isPrimaryKey": False, "isRequired": True}
            ],
            "position": {"x": 100, "y": 100}
        })
    
    if "게시글" in message or "post" in message_lower or "article" in message_lower:
        suggested_tables.append({
            "name": "posts",
            "fields": [
                {"name": "id", "type": "INTEGER", "isPrimaryKey": True, "isRequired": True},
                {"name": "title", "type": "VARCHAR(255)", "isPrimaryKey": False, "isRequired": True},
                {"name": "content", "type": "TEXT", "isPrimaryKey": False, "isRequired": True},
                {"name": "user_id", "type": "INTEGER", "isPrimaryKey": False, "isRequired": True, "isForeignKey": True, "referencedTable": "users", "referencedField": "id"},
                {"name": "created_at", "type": "TIMESTAMP", "isPrimaryKey": False, "isRequired": True}
            ],
            "position": {"x": 400, "y": 100}
        })
    
    return suggested_tables

@app.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    chat_request: ChatRequest,
    current_user: dict = Depends(verify_token)
):
    try:
        # 채팅 히스토리 저장
        chat_history_key = f"chat_history:{chat_request.project_id}"
        
        # 기존 채팅 히스토리 조회
        existing_history = await redis_client.get(chat_history_key)
        if existing_history:
            history = json.loads(existing_history)
        else:
            history = []
        
        # 사용자 메시지 추가
        user_message = {
            "id": str(uuid.uuid4()),
            "role": "user",
            "content": chat_request.message,
            "timestamp": "2024-01-01T00:00:00Z"
        }
        history.append(user_message)
        
        # AI 응답 생성
        suggested_tables = await parse_chat_to_tables(chat_request.message)
        
        if suggested_tables:
            ai_response = f"'{chat_request.message}'을 분석해서 다음과 같은 테이블들을 제안드립니다:\n\n"
            for table in suggested_tables:
                ai_response += f"• {table['name']} 테이블: {len(table['fields'])}개 필드\n"
            ai_response += "\n이 테이블들을 프로젝트에 추가하시겠습니까?"
        else:
            ai_response = "죄송합니다. 메시지에서 명확한 테이블 구조를 파악하기 어렵습니다. 더 구체적인 요구사항을 말씀해 주세요. 예: '사용자와 게시글 테이블을 만들어주세요'"
        
        # AI 응답 메시지 추가
        ai_message = {
            "id": str(uuid.uuid4()),
            "role": "assistant", 
            "content": ai_response,
            "timestamp": "2024-01-01T00:00:01Z"
        }
        history.append(ai_message)
        
        # 채팅 히스토리 저장 (24시간 유지)
        await redis_client.set(chat_history_key, json.dumps(history), ex=86400)
        
        return ChatResponse(
            role="assistant",
            content=ai_response,
            suggested_tables=suggested_tables if suggested_tables else None
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI processing error: {str(e)}"
        )

@app.get("/projects/{project_id}/chat-history")
async def get_chat_history(
    project_id: str,
    current_user: dict = Depends(verify_token)
):
    try:
        chat_history_key = f"chat_history:{project_id}"
        history_json = await redis_client.get(chat_history_key)
        
        if history_json:
            history = json.loads(history_json)
            return {"messages": history}
        else:
            return {"messages": []}
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve chat history: {str(e)}"
        )

@app.delete("/projects/{project_id}/chat-history")
async def clear_chat_history(
    project_id: str,
    current_user: dict = Depends(verify_token)
):
    try:
        chat_history_key = f"chat_history:{project_id}"
        await redis_client.delete(chat_history_key)
        return {"message": "Chat history cleared successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear chat history: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)