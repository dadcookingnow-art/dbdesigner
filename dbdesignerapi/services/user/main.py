from fastapi import FastAPI, HTTPException, Depends, status
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from shared.database import get_database, Base, engine
from shared.auth import get_password_hash, verify_password, create_access_token, verify_token
from shared.models import UserCreate, UserLogin, UserResponse, TokenResponse, VerificationRequest, PasswordResetRequest, PasswordResetConfirm
# from shared.redis_client import redis_client  # Redis 대신 임시 메모리 사용
verification_codes = {}  # 임시 메모리 저장소
password_reset_codes = {}  # 패스워드 리셋 코드 임시 저장소
from services.user.models import User
import random
import string
from datetime import timedelta
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import traceback
from dotenv import load_dotenv

# 환경변수 로드
load_dotenv()

app = FastAPI(title="User Service", version="1.0.0")

def generate_verification_code():
    return ''.join(random.choices(string.digits, k=6))

async def send_verification_email(email: str, nickname: str, verification_code: str):
    """
    인증 메일 발송 (포트 587, 465 순차적 시도)
    1. 포트 587 (STARTTLS)로 메일 발송을 시도합니다.
    2. 실패할 경우, 포트 465 (SSL)로 재시도합니다.
    3. 두 방법 모두 실패하면 최종적으로 예외를 발생시킵니다.
    """
    # .env 파일에서 공통 설정값 읽기
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")

    if not all([smtp_server, smtp_username, smtp_password]):
        raise ValueError("SMTP 환경변수가 .env 파일에 올바르게 설정되지 않았습니다.")

    # 메일 내용 구성
    msg = MIMEMultipart()
    msg['From'] = smtp_username
    msg['To'] = email
    msg['Subject'] = "[DB Designer] 이메일 인증 코드"
    html_body = f"""
    <html><body>
    <h2>DB Designer 회원가입 인증</h2>
    <p>안녕하세요 {nickname}님, 인증 코드는 다음과 같습니다:</p>
    <h1 style="text-align: center;">{verification_code}</h1>
    </body></html>
    """
    msg.attach(MIMEText(html_body, 'html'))
    
    context = ssl.create_default_context()
    sent_successfully = False
    last_exception = None

    # --- 시도 1: 포트 587 (STARTTLS) ---
    print("Attempt 1: Trying STARTTLS on port 587...")
    try:
        with smtplib.SMTP(smtp_server, 587, timeout=10) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(smtp_username, smtp_password)
            server.sendmail(smtp_username, email, msg.as_string())
        
        print("✅ Email sent successfully using STARTTLS (587).")
        sent_successfully = True
    except Exception as e:
        print(f"STARTTLS (587) failed: {type(e).__name__} - {e}")
        last_exception = e

    # --- 시도 2: 포트 465 (SSL) ---
    if not sent_successfully:
        print("\nAttempt 2: Trying SSL/TLS on port 465...")
        try:
            with smtplib.SMTP_SSL(smtp_server, 465, context=context, timeout=10) as server:
                server.login(smtp_username, smtp_password)
                server.sendmail(smtp_username, email, msg.as_string())
            
            print("Email sent successfully using SSL/TLS (465).")
            sent_successfully = True
        except Exception as e:
            print(f"SSL/TLS (465) also failed: {type(e).__name__} - {e}")
            last_exception = e

    # --- 최종 결과 처리 ---
    if not sent_successfully:
        print("\nEmail sending failed after trying both STARTTLS (587) and SSL (465) methods.")
        traceback.print_exc() # 마지막 발생한 에러의 전체 traceback 출력
        raise Exception(f"Email sending failed: {last_exception}")

@app.post("/auth/register", response_model=dict)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_database)):
    print(f"Register request: email={user_data.email}, nickname={user_data.nickname}")
    
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    
    print(result)
    
    if existing_user:
        if not existing_user.is_verified:
            # 미인증 사용자의 경우 새 인증코드 생성 및 재발송
            new_verification_code = generate_verification_code()
            existing_user.verification_code = new_verification_code
            # 비밀번호와 닉네임도 새로 업데이트
            existing_user.hashed_password = get_password_hash(user_data.password)
            existing_user.nickname = user_data.nickname
            
            try:
                # 임시로 메모리에 인증코드 저장
                verification_codes[existing_user.email] = new_verification_code
                
                # 인증 메일 재발송
                devmode = os.getenv("EMAIL_DEV_MODE") == "true"
                # devmode가 False일 때만 이메일 발송 로직을 실행
                if not devmode:
                    print(f"Resending verification email to {existing_user.email}")
                    await send_verification_email(existing_user.email, existing_user.nickname, new_verification_code)
                print(f"New verification code for {existing_user.email}: {new_verification_code}")  # 개발용
                    
                # 메일 발송 성공 후에만 DB 커밋
                await db.commit()
                await db.refresh(existing_user)
                
                return {
                    "message": "Verification email resent",
                    "user_id": existing_user.id,
                    "email": existing_user.email
                }
                
            except Exception as e:
                await db.rollback()
                print(f"Failed to resend verification email: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to send verification email"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered and verified"
            )
    
    verification_code = generate_verification_code()
    hashed_password = get_password_hash(user_data.password)
    
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        nickname=user_data.nickname,
        verification_code=verification_code
    )
    
    try:
        db.add(new_user)
        await db.flush()  # Get ID without committing
        
        # 임시로 메모리에 인증코드 저장
        verification_codes[new_user.email] = verification_code
        
        # 인증 메일 발송 (DB 커밋 전에)
        devmode = os.getenv("EMAIL_DEV_MODE") == "true"
        # devmode가 False일 때만 이메일 발송 로직을 실행
        if not devmode:
            print(f"Sending verification email to {new_user.email}")
            await send_verification_email(new_user.email, new_user.nickname, verification_code)
        print(f"Verification code for {new_user.email}: {verification_code}")  # 개발용
        
        # 메일 발송 성공 후에만 DB 커밋
        await db.commit()
        await db.refresh(new_user)
        
        return {"message": "User registered successfully. Please verify your email.", "verification_code": verification_code}
    except Exception as e:
        await db.rollback()
        print(f"Registration failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again."
        )

@app.post("/auth/verify", response_model=dict)
async def verify_email(verification_data: VerificationRequest, db: AsyncSession = Depends(get_database)):
    print("|<-------------------------------------------------------")
    print(f"Verify request: email={verification_data.email}, code={verification_data.code}")
    print("------------------------------------------------------->|")
    # 메모리에서 인증코드 확인
    stored_code = verification_codes.get(verification_data.email)
    print(f"Stored code for {verification_data.email}: {stored_code}")
    
    if not stored_code or stored_code != verification_data.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code"
        )
    
    # 사용자 조회
    result = await db.execute(select(User).where(User.email == verification_data.email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # 이미 인증된 사용자인지 확인
    if user.is_verified:
        return {
            "message": "Email already verified",
            "user_id": user.id,
            "email": user.email
        }
    
    # 사용자 인증 상태 업데이트
    user.is_verified = True
    user.verification_code = None
    await db.commit()
    await db.refresh(user)
    
    # 메모리에서 인증코드 삭제
    verification_codes.pop(verification_data.email, None)
    print(f"User {user.email} verified successfully")
    
    # 인증 성공 후 JWT 토큰 발급
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    return {
        "message": "Email verified successfully",
        "user_id": user.id,
        "email": user.email,
        "nickname": user.nickname,
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.post("/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_database)):
    result = await db.execute(select(User).where(User.email == user_data.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified"
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/logout", response_model=dict)
async def logout(current_user: dict = Depends(verify_token)):
    """
    로그아웃 처리 (토큰은 클라이언트에서 제거)
    """
    return {
        "message": "Successfully logged out",
        "user_id": current_user["user_id"]
    }

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user(current_user: dict = Depends(verify_token), db: AsyncSession = Depends(get_database)):
    
    result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=user.id,
        email=user.email,
        nickname=user.nickname,
        is_verified=user.is_verified
    )

@app.post("/auth/password-reset/request", response_model=dict)
async def request_password_reset(reset_data: PasswordResetRequest, db: AsyncSession = Depends(get_database)):
    """
    패스워드 재설정 요청 - 이메일로 재설정 코드 발송
    """
    result = await db.execute(select(User).where(User.email == reset_data.email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email first."
        )
    
    # 패스워드 재설정 코드 생성
    reset_code = generate_verification_code()
    
    try:
        # 메모리에 재설정 코드 저장
        password_reset_codes[user.email] = reset_code
        
        # DB에도 저장 (만료시간 포함)
        from datetime import datetime, timedelta, timezone
        user.password_reset_code = reset_code
        user.password_reset_expires = datetime.now(timezone.utc) + timedelta(minutes=3)  # 3분 후 만료
        
        # 재설정 메일 발송
        devmode = os.getenv("EMAIL_DEV_MODE") == "true"
        if not devmode:
            await send_password_reset_email(user.email, user.nickname, reset_code)
        
        print(f"Password reset code for {user.email}: {reset_code}")  # 개발용
        
        await db.commit()
        await db.refresh(user)
        
        return {
            "message": "Password reset email sent successfully", 
            "email": user.email,
            "expires_in_minutes": 3
        }
        
    except Exception as e:
        await db.rollback()
        print(f"Failed to send password reset email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send password reset email"
        )

@app.post("/auth/password-reset/confirm", response_model=dict)
async def confirm_password_reset(reset_data: PasswordResetConfirm, db: AsyncSession = Depends(get_database)):
    """
    패스워드 재설정 확인 - 코드 검증 후 새 패스워드 설정
    """
    # 메모리에서 재설정 코드 확인
    stored_code = password_reset_codes.get(reset_data.email)
    if not stored_code or stored_code != reset_data.reset_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset code"
        )
    
    # 사용자 조회
    result = await db.execute(select(User).where(User.email == reset_data.email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # 만료시간 확인
    from datetime import datetime, timezone
    if user.password_reset_expires and user.password_reset_expires < datetime.now(timezone.utc):
        # 만료된 코드 정리
        password_reset_codes.pop(reset_data.email, None)
        user.password_reset_code = None
        user.password_reset_expires = None
        await db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset code has expired"
        )
    
    try:
        # 새 패스워드 설정
        user.hashed_password = get_password_hash(reset_data.new_password)
        user.password_reset_code = None
        user.password_reset_expires = None
        
        await db.commit()
        await db.refresh(user)
        
        # 메모리에서 재설정 코드 삭제
        password_reset_codes.pop(reset_data.email, None)
        
        print(f"Password reset successful for {user.email}")
        
        return {
            "message": "Password reset successfully",
            "user_id": user.id,
            "email": user.email
        }
        
    except Exception as e:
        await db.rollback()
        print(f"Password reset failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset failed"
        )

async def send_password_reset_email(email: str, nickname: str, reset_code: str):
    """
    패스워드 재설정 메일 발송
    """
    # .env 파일에서 공통 설정값 읽기
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")

    if not all([smtp_server, smtp_username, smtp_password]):
        raise ValueError("SMTP 환경변수가 .env 파일에 올바르게 설정되지 않았습니다.")

    # 메일 내용 구성
    msg = MIMEMultipart()
    msg['From'] = smtp_username
    msg['To'] = email
    msg['Subject'] = "[DB Designer] 패스워드 재설정 코드"
    html_body = f"""
    <html><body>
    <h2>DB Designer 패스워드 재설정</h2>
    <p>안녕하세요 {nickname}님,</p>
    <p>패스워드 재설정을 위한 인증 코드입니다:</p>
    <h1 style="text-align: center; color: #e74c3c;">{reset_code}</h1>
    <p><strong>이 코드는 15분 후에 만료됩니다.</strong></p>
    <p>만약 패스워드 재설정을 요청하지 않았다면, 이 이메일을 무시하세요.</p>
    </body></html>
    """
    msg.attach(MIMEText(html_body, 'html'))
    
    context = ssl.create_default_context()
    sent_successfully = False
    last_exception = None

    # 포트 587 (STARTTLS) 시도
    try:
        with smtplib.SMTP(smtp_server, 587, timeout=10) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(smtp_username, smtp_password)
            server.sendmail(smtp_username, email, msg.as_string())
        
        print("✅ Password reset email sent successfully using STARTTLS (587).")
        sent_successfully = True
    except Exception as e:
        print(f"STARTTLS (587) failed: {type(e).__name__} - {e}")
        last_exception = e

    # 포트 465 (SSL) 시도
    if not sent_successfully:
        try:
            with smtplib.SMTP_SSL(smtp_server, 465, context=context, timeout=10) as server:
                server.login(smtp_username, smtp_password)
                server.sendmail(smtp_username, email, msg.as_string())
            
            print("Password reset email sent successfully using SSL/TLS (465).")
            sent_successfully = True
        except Exception as e:
            print(f"SSL/TLS (465) also failed: {type(e).__name__} - {e}")
            last_exception = e

    if not sent_successfully:
        print("Password reset email sending failed after trying both methods.")
        traceback.print_exc()
        raise Exception(f"Email sending failed: {last_exception}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)