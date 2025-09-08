-- Password Reset 기능을 위한 스키마 업데이트
-- tb_model_users 테이블에 password_reset_code, password_reset_expires 컬럼 추가

-- 스키마 설정
SET search_path TO public2;

-- password_reset_code 컬럼 추가 (이미 존재하는 경우 무시)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public2'
        AND table_name = 'tb_model_users'
        AND column_name = 'password_reset_code'
    ) THEN
        ALTER TABLE tb_model_users ADD COLUMN password_reset_code VARCHAR(6);
    END IF;
END $$;

-- password_reset_expires 컬럼 추가 (이미 존재하는 경우 무시)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public2'
        AND table_name = 'tb_model_users'
        AND column_name = 'password_reset_expires'
    ) THEN
        ALTER TABLE tb_model_users ADD COLUMN password_reset_expires TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 업데이트된 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public2' 
AND table_name = 'tb_model_users'
ORDER BY ordinal_position;