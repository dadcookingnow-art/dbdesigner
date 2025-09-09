import os
import json
import httpx
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
        self.model_name = "gemini-2.0-flash"
    
    async def parse_message_to_tables(self, message: str) -> List[Dict[str, Any]]:
        """
        사용자 메시지를 분석해서 데이터베이스 테이블 구조를 생성
        """
        prompt = self._create_table_generation_prompt(message)
        
        try:
            response_text = await self._call_gemini_api(prompt)
            return self._parse_gemini_response(response_text)
        except Exception as e:
            print(f"Gemini API 호출 실패: {str(e)}")
            print(f"오류 타입: {type(e).__name__}")
            import traceback
            print(f"스택 트레이스:\n{traceback.format_exc()}")
            # Fallback to simple keyword matching
            return self._fallback_table_generation(message)
    
    async def _call_gemini_api(self, prompt: str) -> str:
        """
        Gemini REST API 호출
        """
        url = f"{self.base_url}/models/{self.model_name}:generateContent"
        
        headers = {
            "Content-Type": "application/json",
            "X-goog-api-key": self.api_key
        }
        
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ]
        }
        
        # Timeout 설정 (60초)
        timeout = httpx.Timeout(60.0, connect=30.0)
        
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(url, json=payload, headers=headers)
            
            # 디버깅을 위한 상세 로깅
            print(f"🔍 API 요청 URL: {url}")
            print(f"🔍 응답 상태: {response.status_code}")
            print(f"🔍 응답 헤더: {dict(response.headers)}")
            print(f"🔍 응답 내용: {response.text[:500]}...")
            
            response.raise_for_status()
            
            data = response.json()
            
            # Extract text from response
            if "candidates" in data and len(data["candidates"]) > 0:
                candidate = data["candidates"][0]
                if "content" in candidate and "parts" in candidate["content"]:
                    parts = candidate["content"]["parts"]
                    if len(parts) > 0 and "text" in parts[0]:
                        return parts[0]["text"]
            
            print(f"❌ 예상치 못한 응답 구조: {json.dumps(data, indent=2)}")
            raise ValueError("No text content in Gemini response")
    
    def _create_table_generation_prompt(self, message: str) -> str:
        """
        테이블 생성을 위한 프롬프트 생성
        """
        return f"""
당신은 데이터베이스 설계 전문가입니다. 사용자의 요구사항을 분석해서 적절한 데이터베이스 테이블 구조를 JSON 형태로 제안해주세요.

사용자 요구사항: "{message}"

응답 형식은 반드시 다음 JSON 배열 형태로만 답변해주세요:

```json
[
  {{
    "name": "테이블명",
    "fields": [
      {{
        "name": "필드명",
        "type": "데이터타입",
        "isPrimaryKey": true/false,
        "isRequired": true/false,
        "isForeignKey": true/false,
        "referencedTable": "참조테이블명",
        "referencedField": "참조필드명"
      }}
    ],
    "position": {{"x": x좌표, "y": y좌표}}
  }}
]
```

규칙:
1. 테이블명은 영어 복수형으로 작성
2. 필드명은 영어 snake_case로 작성
3. 모든 테이블에 id 필드(INTEGER, PRIMARY KEY) 포함
4. 생성일시 필드(created_at, TIMESTAMP) 포함
5. 외래키 관계가 있는 경우 isForeignKey, referencedTable, referencedField 설정
6. position은 테이블 간 겹치지 않도록 설정 (100 단위로 배치)
7. 일반적인 데이터타입 사용: INTEGER, VARCHAR(길이), TEXT, TIMESTAMP, DECIMAL(전체,소수) 등

JSON 형태로만 답변하고 다른 설명은 추가하지 마세요.
        """
    
    def _parse_gemini_response(self, response_text: str) -> List[Dict[str, Any]]:
        """
        Gemini 응답을 파싱해서 테이블 구조 추출
        """
        try:
            # JSON 코드 블록 추출
            if "```json" in response_text:
                start = response_text.find("```json") + 7
                end = response_text.find("```", start)
                json_text = response_text[start:end].strip()
            elif "```" in response_text:
                start = response_text.find("```") + 3
                end = response_text.rfind("```")
                json_text = response_text[start:end].strip()
            else:
                json_text = response_text.strip()
            
            # JSON 파싱
            tables = json.loads(json_text)
            
            # 데이터 검증 및 정리
            validated_tables = []
            for i, table in enumerate(tables):
                if self._validate_table_structure(table):
                    validated_tables.append(table)
            
            return validated_tables
            
        except json.JSONDecodeError as e:
            print(f"JSON 파싱 실패: {str(e)}")
            print(f"응답 텍스트: {response_text}")
            return []
        except Exception as e:
            print(f"응답 파싱 실패: {str(e)}")
            return []
    
    def _validate_table_structure(self, table: Dict[str, Any]) -> bool:
        """
        테이블 구조 유효성 검증
        """
        required_fields = ["name", "fields", "position"]
        if not all(field in table for field in required_fields):
            return False
        
        if not isinstance(table["fields"], list) or not table["fields"]:
            return False
        
        for field in table["fields"]:
            required_field_attrs = ["name", "type", "isPrimaryKey", "isRequired"]
            if not all(attr in field for attr in required_field_attrs):
                return False
        
        return True
    
    def _fallback_table_generation(self, message: str) -> List[Dict[str, Any]]:
        """
        Gemini API 실패 시 폴백 로직 (기존 키워드 매칭)
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
        
        if "게시글" in message or "post" in message_lower:
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

# 싱글톤 인스턴스
_gemini_service_instance: Optional[GeminiService] = None

def get_gemini_service() -> GeminiService:
    """
    GeminiService 싱글톤 인스턴스 반환
    """
    global _gemini_service_instance
    if _gemini_service_instance is None:
        _gemini_service_instance = GeminiService()
    return _gemini_service_instance