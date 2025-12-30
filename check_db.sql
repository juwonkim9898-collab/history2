-- 1. 테이블 존재 확인
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'history'
) as table_exists;

-- 2. 전체 데이터 개수
SELECT COUNT(*) as total_records FROM history;

-- 3. user_id 목록과 개수
SELECT user_id, COUNT(*) as count 
FROM history 
GROUP BY user_id
ORDER BY count DESC;

-- 4. 최근 5개 데이터 샘플
SELECT id, user_id, 
       LEFT(content, 50) as content_preview, 
       record_date, 
       tags 
FROM history 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. 만약 데이터가 있는데 user_id가 user123이 아니라면 이 쿼리 실행:
-- UPDATE history SET user_id = 'user123';
