-- 테이블에 indexes 컬럼 추가
-- tb_model_tables 테이블에 indexes JSON 컬럼 추가

SET search_path TO public2;

-- indexes 컬럼 추가 (이미 존재하는 경우 무시)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public2'
        AND table_name = 'tb_model_tables'
        AND column_name = 'indexes'
    ) THEN
        ALTER TABLE tb_model_tables ADD COLUMN indexes JSONB DEFAULT '[]'::jsonb;
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
AND table_name = 'tb_model_tables'
ORDER BY ordinal_position;