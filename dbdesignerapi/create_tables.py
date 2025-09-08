#!/usr/bin/env python3
"""
데이터베이스 테이블 생성 스크립트
PostgreSQL의 public2 스키마에 필요한 테이블들을 생성합니다.
"""

import asyncio
import os
from sqlalchemy import text
from config.settings import settings
from sqlalchemy.ext.asyncio import create_async_engine

async def create_schema_and_tables():
    """스키마와 테이블을 생성합니다."""
    
    engine = create_async_engine(settings.ASYNC_DATABASE_URL)
    
    # DDL 파일 읽기
    ddl_file = os.path.join(os.path.dirname(__file__), 'database_setup.sql')
    
    try:
        with open(ddl_file, 'r', encoding='utf-8') as f:
            sql_commands = f.read()
        
        async with engine.begin() as conn:
            # SQL 명령어들을 세미콜론으로 분리하여 실행
            commands = [cmd.strip() for cmd in sql_commands.split(';') if cmd.strip() and not cmd.strip().startswith('--')]
            
            for command in commands:
                if command:
                    try:
                        await conn.execute(text(command))
                        print(f"✅ Executed: {command[:50]}...")
                    except Exception as e:
                        if "already exists" not in str(e).lower():
                            print(f"❌ Error executing command: {command[:50]}...")
                            print(f"   Error: {e}")
        
        print("\n🎉 Database setup completed successfully!")
        print("\n📋 Created tables:")
        print("   • users (User Service)")
        print("   • projects (Project Service)")
        print("   • tables (Schema Service)")
        print("   • relationships (Schema Service)")
        
    except FileNotFoundError:
        print(f"❌ DDL file not found: {ddl_file}")
    except Exception as e:
        print(f"❌ Database setup failed: {e}")

async def verify_tables():
    """생성된 테이블들을 확인합니다."""
    print("\n🔍 Verifying created tables...")
    
    engine = create_async_engine(settings.ASYNC_DATABASE_URL)
    
    async with engine.begin() as conn:
        result = await conn.execute(text("""
            SELECT 
                schemaname,
                tablename,
                tableowner
            FROM pg_tables 
            WHERE schemaname = 'public2'
            ORDER BY tablename;
        """))
        
        tables = result.fetchall()
        
        if tables:
            print("\n📊 Tables in public2 schema:")
            for table in tables:
                print(f"   • {table.tablename} (owner: {table.tableowner})")
        else:
            print("❌ No tables found in public2 schema")

if __name__ == "__main__":
    print("🚀 Starting database setup...")
    print(f"📍 Target: {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME} schema {settings.DB_SCHEMA}")
    print(f"🔐 User: {settings.DB_USER}")
    
    asyncio.run(create_schema_and_tables())
    asyncio.run(verify_tables())
    
    print("\n✨ Setup complete! You can now start the microservices.")
    print("💡 Run: python -m services.user.main (or use start_services.bat)")