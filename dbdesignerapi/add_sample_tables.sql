-- 기존 프로젝트에 샘플 테이블과 관계 추가하는 스크립트
-- 사용법: 하단의 project_id 값만 실제 프로젝트 ID로 변경하고 실행

SET search_path TO public2;

DO $$
DECLARE
    -- 🎯 이것만 수정하세요! (실제 존재하는 프로젝트 ID)
    target_project_id VARCHAR(36) := 'your-project-id-here';
    
    -- 테이블 위치 설정
    base_x INTEGER := 100;
    base_y INTEGER := 100;
    spacing INTEGER := 300;
    
BEGIN
    -- 프로젝트 존재 여부 확인
    IF NOT EXISTS (SELECT 1 FROM public2.tb_model_projects WHERE id = target_project_id) THEN
        RAISE EXCEPTION '❌ 프로젝트 ID "%"가 존재하지 않습니다!', target_project_id;
    END IF;
    
    RAISE NOTICE '🚀 프로젝트 "%"에 샘플 테이블 추가 중...', target_project_id;
    
    -- 1. users 테이블
    INSERT INTO public2.tb_model_tables (id, name, project_id, fields, position, created_at, updated_at)
    VALUES (
        gen_random_uuid()::text,
        'users',
        target_project_id,
        '[
            {"name": "id", "type": "UUID", "is_primary_key": true, "is_required": true, "constraints": "PRIMARY KEY", "is_foreign_key": false, "referenced_table": null, "referenced_field": null},
            {"name": "email", "type": "VARCHAR(255)", "is_primary_key": false, "is_required": true, "constraints": "UNIQUE NOT NULL", "is_foreign_key": false, "referenced_table": null, "referenced_field": null},
            {"name": "name", "type": "VARCHAR(100)", "is_primary_key": false, "is_required": true, "constraints": "NOT NULL", "is_foreign_key": false, "referenced_table": null, "referenced_field": null},
            {"name": "created_at", "type": "TIMESTAMP", "is_primary_key": false, "is_required": true, "constraints": "DEFAULT NOW()", "is_foreign_key": false, "referenced_table": null, "referenced_field": null}
        ]'::json,
        format('{"x": %s, "y": %s}', base_x, base_y)::json,
        NOW(), NOW()
    );
    
    -- 2. categories 테이블  
    INSERT INTO public2.tb_model_tables (id, name, project_id, fields, position, created_at, updated_at)
    VALUES (
        gen_random_uuid()::text,
        'categories',
        target_project_id,
        '[
            {"name": "id", "type": "UUID", "is_primary_key": true, "is_required": true, "constraints": "PRIMARY KEY", "is_foreign_key": false, "referenced_table": null, "referenced_field": null},
            {"name": "name", "type": "VARCHAR(100)", "is_primary_key": false, "is_required": true, "constraints": "NOT NULL", "is_foreign_key": false, "referenced_table": null, "referenced_field": null},
            {"name": "description", "type": "TEXT", "is_primary_key": false, "is_required": false, "constraints": null, "is_foreign_key": false, "referenced_table": null, "referenced_field": null}
        ]'::json,
        format('{"x": %s, "y": %s}', base_x + spacing, base_y)::json,
        NOW(), NOW()
    );
    
    -- 3. products 테이블
    INSERT INTO public2.tb_model_tables (id, name, project_id, fields, position, created_at, updated_at)
    VALUES (
        gen_random_uuid()::text,
        'products',
        target_project_id,
        '[
            {"name": "id", "type": "UUID", "is_primary_key": true, "is_required": true, "constraints": "PRIMARY KEY", "is_foreign_key": false, "referenced_table": null, "referenced_field": null},
            {"name": "name", "type": "VARCHAR(255)", "is_primary_key": false, "is_required": true, "constraints": "NOT NULL", "is_foreign_key": false, "referenced_table": null, "referenced_field": null},
            {"name": "price", "type": "DECIMAL(10,2)", "is_primary_key": false, "is_required": true, "constraints": "NOT NULL CHECK (price >= 0)", "is_foreign_key": false, "referenced_table": null, "referenced_field": null},
            {"name": "category_id", "type": "UUID", "is_primary_key": false, "is_required": false, "constraints": null, "is_foreign_key": true, "referenced_table": "categories", "referenced_field": "id"}
        ]'::json,
        format('{"x": %s, "y": %s}', base_x + spacing * 2, base_y)::json,
        NOW(), NOW()
    );
    
    -- 4. orders 테이블
    INSERT INTO public2.tb_model_tables (id, name, project_id, fields, position, created_at, updated_at)
    VALUES (
        gen_random_uuid()::text,
        'orders',
        target_project_id,
        '[
            {"name": "id", "type": "UUID", "is_primary_key": true, "is_required": true, "constraints": "PRIMARY KEY", "is_foreign_key": false, "referenced_table": null, "referenced_field": null},
            {"name": "user_id", "type": "UUID", "is_primary_key": false, "is_required": true, "constraints": "NOT NULL", "is_foreign_key": true, "referenced_table": "users", "referenced_field": "id"},
            {"name": "total_amount", "type": "DECIMAL(10,2)", "is_primary_key": false, "is_required": true, "constraints": "NOT NULL CHECK (total_amount >= 0)", "is_foreign_key": false, "referenced_table": null, "referenced_field": null},
            {"name": "status", "type": "VARCHAR(20)", "is_primary_key": false, "is_required": true, "constraints": "DEFAULT ''pending''", "is_foreign_key": false, "referenced_table": null, "referenced_field": null}
        ]'::json,
        format('{"x": %s, "y": %s}', base_x, base_y + spacing)::json,
        NOW(), NOW()
    );
    
    -- 5. 관계 생성
    INSERT INTO public2.tb_model_relationships (id, project_id, from_table, from_field, to_table, to_field, type, created_at)
    VALUES 
    (
        gen_random_uuid()::text,
        target_project_id,
        'orders', 'user_id', 'users', 'id', '1:N', NOW()
    ),
    (
        gen_random_uuid()::text,
        target_project_id,
        'products', 'category_id', 'categories', 'id', 'N:1', NOW()
    );
    
    RAISE NOTICE '✅ 완료! 추가된 항목:';
    RAISE NOTICE '   - 테이블 4개: users, categories, products, orders';
    RAISE NOTICE '   - 관계 2개: users↔orders, categories↔products';
    
END $$;

-- 추가 결과 확인
SELECT 
    t.name as table_name,
    t.position,
    json_array_length(t.fields) as field_count
FROM public2.tb_model_tables t 
WHERE t.project_id = 'your-project-id-here'  -- 여기도 동일한 프로젝트 ID로 변경
ORDER BY t.created_at DESC 
LIMIT 4;