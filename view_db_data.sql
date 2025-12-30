-- PostgreSQL DB 데이터 확인 쿼리
-- DBeaver에서 이 파일을 열고 실행하세요

-- 1. 전체 레코드 수 확인
SELECT COUNT(*) as total_records FROM history;

-- 2. 모든 데이터 보기 (최근 20개)
SELECT 
    id,
    user_id,
    LEFT(content, 100) as content_preview,
    record_date,
    tags,
    created_at
FROM history
ORDER BY id DESC
LIMIT 20;

-- 3. 태그별 개수 확인
SELECT 
    UNNEST(tags) as tag,
    COUNT(*) as count
FROM history
WHERE tags IS NOT NULL
GROUP BY tag
ORDER BY count DESC;

-- 4. 특정 태그로 검색 (예: '한국전쟁')
SELECT 
    id,
    LEFT(content, 100) as content_preview,
    tags
FROM history
WHERE '한국전쟁' = ANY(tags);

-- 5. content 내용 상세 보기 (JSON 파싱)
SELECT 
    id,
    content::json->>'title' as title,
    content::json->>'year' as year,
    content::json->>'description' as description,
    tags,
    record_date
FROM history
ORDER BY id DESC
LIMIT 10;

-- 6. 중복 레코드 찾기 (같은 title과 year)
SELECT 
    content::json->>'title' as title,
    content::json->>'year' as year,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(id) as ids
FROM history
GROUP BY content::json->>'title', content::json->>'year'
HAVING COUNT(*) > 1;

-- 7. 특정 user_id의 데이터만 보기
SELECT 
    id,
    content::json->>'title' as title,
    content::json->>'year' as year,
    tags
FROM history
WHERE user_id = 'user123'
ORDER BY id DESC;

-- 8. 날짜별 레코드 수
SELECT 
    record_date,
    COUNT(*) as count
FROM history
GROUP BY record_date
ORDER BY record_date DESC;
