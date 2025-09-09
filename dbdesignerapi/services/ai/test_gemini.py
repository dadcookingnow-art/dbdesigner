#!/usr/bin/env python3
"""
Gemini 서비스 테스트 스크립트
"""
import asyncio
import sys
import os
import json
from pathlib import Path

# 프로젝트 루트 경로를 sys.path에 추가
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from services.ai.gemini_service import get_gemini_service

async def test_gemini_integration():
    """
    Gemini 통합 테스트
    """
    print("🤖 Gemini 서비스 테스트 시작...")
    
    # 테스트 케이스들
    test_cases = [
        "사용자 정보를 저장할 테이블과 게시글 테이블을 만들어주세요",
        "블로그 시스템을 위한 테이블 구조를 설계해주세요. 사용자, 포스트, 댓글이 필요합니다",
        "온라인 쇼핑몰을 위한 데이터베이스 테이블을 만들어주세요. 상품, 주문, 사용자 정보가 필요합니다",
        "학교 관리 시스템용 테이블을 만들어주세요. 학생, 교사, 수업 정보가 필요합니다"
    ]
    
    try:
        gemini_service = get_gemini_service()
        print("✅ Gemini 서비스 초기화 성공!")
        
        for i, test_message in enumerate(test_cases, 1):
            print(f"\n📝 테스트 케이스 {i}: {test_message}")
            print("-" * 60)
            
            try:
                result = await gemini_service.parse_message_to_tables(test_message)
                
                if result:
                    print(f"✅ {len(result)}개 테이블 생성됨:")
                    for table in result:
                        print(f"  - {table['name']}: {len(table['fields'])}개 필드")
                    
                    # JSON 형태로 결과 출력 (디버깅용)
                    print(f"\n🔍 JSON 결과:")
                    print(json.dumps(result, indent=2, ensure_ascii=False))
                else:
                    print("❌ 테이블이 생성되지 않음")
                    
            except Exception as e:
                print(f"❌ 테스트 케이스 {i} 실패: {str(e)}")
            
            # API 호출 간격 조정 (Rate Limit 방지)
            if i < len(test_cases):
                print("⏳ 3초 대기 중...")
                await asyncio.sleep(3)
            
            print("\n" + "="*80 + "\n")
    
    except Exception as e:
        print(f"❌ Gemini 서비스 초기화 실패: {str(e)}")
        print("💡 .env 파일에 GEMINI_API_KEY가 설정되어 있는지 확인하세요")
        return False
    
    print("🎉 테스트 완료!")
    return True

async def test_fallback():
    """
    폴백 로직 테스트
    """
    print("\n🔄 폴백 로직 테스트...")
    
    # 임시로 잘못된 API 키 설정
    original_key = os.environ.get("GEMINI_API_KEY")
    os.environ["GEMINI_API_KEY"] = "invalid-key"
    
    try:
        from services.ai.main import parse_chat_to_tables
        result = await parse_chat_to_tables("사용자와 게시글 테이블을 만들어주세요")
        
        if result:
            print(f"✅ 폴백 로직 동작: {len(result)}개 테이블 생성됨")
            for table in result:
                print(f"  - {table['name']}")
        else:
            print("❌ 폴백 로직 실패")
    
    except Exception as e:
        print(f"❌ 폴백 테스트 실패: {str(e)}")
    
    finally:
        # API 키 복원
        if original_key:
            os.environ["GEMINI_API_KEY"] = original_key

if __name__ == "__main__":
    print("🚀 Gemini 통합 테스트 시작")
    print("=" * 80)
    
    # 환경 변수 확인
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your-gemini-api-key-here":
        print("⚠️  GEMINI_API_KEY가 설정되지 않았습니다.")
        print("📋 테스트를 위해 .env 파일에 실제 API 키를 설정해주세요:")
        print("   GEMINI_API_KEY=your-actual-api-key")
        print("\n🔄 폴백 테스트만 실행합니다...")
        asyncio.run(test_fallback())
    else:
        print(f"🔑 API 키 확인됨: {api_key[:10]}...")
        asyncio.run(test_gemini_integration())