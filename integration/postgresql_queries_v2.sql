-- ============================================
-- 범용 기록 시스템 - PostgreSQL 주요 쿼리 v2
-- ============================================

-- ============================================
-- 1. 기본 CRUD 쿼리
-- ============================================

-- 1.1 모든 기록 조회 (최신순)
SELECT 
    id,
    title,
    content,
    record_date,
    category,
    tags,
    created_at,
    updated_at
FROM records
WHERE user_id = $1
ORDER BY record_date DESC NULLS LAST, created_at DESC;

-- 1.2 특정 기록 조회
SELECT * FROM records
WHERE id = $1 AND user_id = $2;

-- 1.3 기록 추가
INSERT INTO records (
    user_id, title, content, record_date, category, tags
) VALUES (
    $1, $2, $3, $4, $5, $6
)
RETURNING id, title, record_date, category, created_at;

-- 1.4 기록 수정
UPDATE records
SET 
    title = $1,
    content = $2,
    record_date = $3,
    category = $4,
    tags = $5
WHERE id = $6 AND user_id = $7
RETURNING *;

-- 1.5 기록 삭제
DELETE FROM records
WHERE id = $1 AND user_id = $2;

-- 1.6 모든 기록 삭제 (사용자별)
DELETE FROM records
WHERE user_id = $1;

-- ============================================
-- 2. 검색 및 필터링
-- ============================================

-- 2.1 제목/내용으로 검색
SELECT * FROM records
WHERE user_id = $1
  AND (
    title ILIKE '%' || $2 || '%'
    OR content ILIKE '%' || $2 || '%'
  )
ORDER BY record_date DESC NULLS LAST;

-- 2.2 카테고리로 필터링
SELECT * FROM records
WHERE user_id = $1 AND category = $2
ORDER BY record_date DESC;

-- 2.3 태그로 필터링
SELECT * FROM records
WHERE user_id = $1
  AND $2 = ANY(tags)
ORDER BY record_date DESC;

-- 2.4 날짜 범위로 검색
SELECT * FROM records
WHERE user_id = $1
  AND record_date BETWEEN $2 AND $3
ORDER BY record_date DESC;

-- 2.6 특정 연도/월 기록 조회
SELECT * FROM records
WHERE user_id = $1
  AND EXTRACT(YEAR FROM record_date) = $2
  AND EXTRACT(MONTH FROM record_date) = $3
ORDER BY record_date DESC;

-- ============================================
-- 3. 태그 관련 쿼리
-- ============================================

-- 3.1 모든 태그 조회 (중복 제거)
SELECT DISTINCT unnest(tags) AS tag
FROM records
WHERE user_id = $1
ORDER BY tag;

-- 3.2 태그별 기록 개수
SELECT 
    unnest(tags) AS tag,
    COUNT(*) AS record_count
FROM records
WHERE user_id = $1
GROUP BY unnest(tags)
ORDER BY record_count DESC, tag;

-- 3.3 인기 태그 Top 10
SELECT 
    unnest(tags) AS tag,
    COUNT(*) AS count
FROM records
WHERE user_id = $1
GROUP BY unnest(tags)
ORDER BY count DESC
LIMIT 10;

-- ============================================
-- 4. 카테고리 관련 쿼리
-- ============================================

-- 4.1 사용자의 모든 카테고리 조회
SELECT 
    id,
    name,
    color,
    icon,
    display_order
FROM categories
WHERE user_id = $1
ORDER BY display_order, name;

-- 4.2 카테고리 추가
INSERT INTO categories (user_id, name, color, icon, display_order)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, name, color, icon;

-- 4.3 카테고리 수정
UPDATE categories
SET 
    name = $1,
    color = $2,
    icon = $3,
    display_order = $4
WHERE id = $5 AND user_id = $6
RETURNING *;

-- 4.4 카테고리 삭제
DELETE FROM categories
WHERE id = $1 AND user_id = $2;

-- 4.5 카테고리별 기록 개수
SELECT 
    c.id,
    c.name,
    c.color,
    c.icon,
    COUNT(r.id) AS record_count
FROM categories c
LEFT JOIN records r ON c.name = r.category AND c.user_id = r.user_id
WHERE c.user_id = $1
GROUP BY c.id, c.name, c.color, c.icon
ORDER BY c.display_order;

-- ============================================
-- 5. 통계 쿼리
-- ============================================

-- 5.1 전체 통계
SELECT 
    COUNT(*) AS total_records,
    COUNT(DISTINCT category) AS category_count,
    MIN(record_date) AS first_record_date,
    MAX(record_date) AS last_record_date
FROM records
WHERE user_id = $1;

-- 5.2 월별 기록 통계
SELECT 
    DATE_TRUNC('month', record_date) AS month,
    COUNT(*) AS record_count
FROM records
WHERE user_id = $1
  AND record_date IS NOT NULL
GROUP BY DATE_TRUNC('month', record_date)
ORDER BY month DESC;

-- 5.3 카테고리별 통계
SELECT 
    category,
    COUNT(*) AS record_count,
    MAX(record_date) AS last_record_date
FROM records
WHERE user_id = $1 AND category IS NOT NULL
GROUP BY category
ORDER BY record_count DESC;

-- 5.4 최근 7일 기록 개수
SELECT 
    record_date::DATE AS date,
    COUNT(*) AS count
FROM records
WHERE user_id = $1
  AND record_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY record_date::DATE
ORDER BY date DESC;

-- 5.5 연도별 통계
SELECT 
    EXTRACT(YEAR FROM record_date) AS year,
    COUNT(*) AS record_count,
    COUNT(DISTINCT category) AS category_count
FROM records
WHERE user_id = $1
  AND record_date IS NOT NULL
GROUP BY EXTRACT(YEAR FROM record_date)
ORDER BY year DESC;

-- ============================================
-- 7. 첨부파일 관련
-- ============================================

-- 7.1 첨부파일 추가
INSERT INTO record_attachments (
    record_id, file_name, file_path, file_size, mime_type
) VALUES (
    $1, $2, $3, $4, $5
)
RETURNING id, file_name, created_at;

-- 7.2 기록의 모든 첨부파일 조회
SELECT 
    id,
    file_name,
    file_path,
    file_size,
    mime_type,
    created_at
FROM record_attachments
WHERE record_id = $1
ORDER BY created_at;

-- 7.3 첨부파일 삭제
DELETE FROM record_attachments
WHERE id = $1 AND record_id = $2;

-- ============================================
-- 8. 고급 쿼리
-- ============================================

-- 8.1 전체 텍스트 검색 (Full Text Search)
SELECT 
    id,
    title,
    content,
    record_date,
    category,
    ts_rank(
        to_tsvector('korean', title || ' ' || content),
        plainto_tsquery('korean', $2)
    ) AS rank
FROM records
WHERE user_id = $1
  AND to_tsvector('korean', title || ' ' || content) 
      @@ plainto_tsquery('korean', $2)
ORDER BY rank DESC, record_date DESC;

-- 8.2 페이지네이션
SELECT * FROM records
WHERE user_id = $1
ORDER BY record_date DESC NULLS LAST, created_at DESC
LIMIT $2 OFFSET $3;

-- 8.3 최근 수정된 기록 (Top 10)
SELECT 
    id,
    title,
    record_date,
    category,
    updated_at
FROM records
WHERE user_id = $1
ORDER BY updated_at DESC
LIMIT 10;

-- 8.4 카테고리별 최신 기록
SELECT DISTINCT ON (category)
    id,
    title,
    content,
    record_date,
    category,
    created_at
FROM records
WHERE user_id = $1 AND category IS NOT NULL
ORDER BY category, record_date DESC NULLS LAST;

-- 8.5 태그 조합 검색 (AND 조건)
SELECT * FROM records
WHERE user_id = $1
  AND tags @> $2::TEXT[]  -- $2는 태그 배열 (예: ARRAY['개발', '학습'])
ORDER BY record_date DESC;

-- 8.6 태그 조합 검색 (OR 조건)
SELECT * FROM records
WHERE user_id = $1
  AND tags && $2::TEXT[]  -- $2는 태그 배열
ORDER BY record_date DESC;

-- ============================================
-- 9. 데이터 내보내기/가져오기
-- ============================================

-- 9.1 사용자 데이터 전체 내보내기 (JSON)
SELECT json_build_object(
    'user', json_build_object(
        'id', u.id,
        'username', u.username,
        'email', u.email
    ),
    'records', (
        SELECT json_agg(
            json_build_object(
                'title', r.title,
                'content', r.content,
                'record_date', r.record_date,
                'category', r.category,
                'tags', r.tags,
                'is_favorite', r.is_favorite,
                'created_at', r.created_at
            ) ORDER BY r.record_date DESC
        )
        FROM records r
        WHERE r.user_id = u.id
    ),
    'categories', (
        SELECT json_agg(
            json_build_object(
                'name', c.name,
                'color', c.color,
                'icon', c.icon
            ) ORDER BY c.display_order
        )
        FROM categories c
        WHERE c.user_id = u.id
    )
) AS export_data
FROM users u
WHERE u.id = $1;

-- 9.2 CSV 형식으로 내보내기 (COPY 명령어)
-- COPY (
--     SELECT 
--         title,
--         content,
--         record_date,
--         category,
--         array_to_string(tags, ',') AS tags,
--         is_favorite,
--         created_at
--     FROM records
--     WHERE user_id = 1
--     ORDER BY record_date DESC
-- ) TO '/tmp/records_export.csv' WITH CSV HEADER;

-- ============================================
-- 10. 대시보드용 쿼리
-- ============================================

-- 10.1 대시보드 요약 정보
SELECT 
    (SELECT COUNT(*) FROM records WHERE user_id = $1) AS total_records,
    (SELECT COUNT(DISTINCT category) FROM records WHERE user_id = $1) AS category_count,
    (SELECT COUNT(*) FROM records WHERE user_id = $1 AND record_date >= CURRENT_DATE - INTERVAL '7 days') AS recent_count,
    (SELECT MAX(record_date) FROM records WHERE user_id = $1) AS last_record_date;

-- 10.2 최근 활동 (최근 5개 기록)
SELECT 
    id,
    title,
    record_date,
    category,
    created_at
FROM records
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 5;

-- 10.3 월별 활동 그래프 데이터 (최근 12개월)
SELECT 
    TO_CHAR(month, 'YYYY-MM') AS month_label,
    record_count
FROM (
    SELECT 
        DATE_TRUNC('month', record_date) AS month,
        COUNT(*) AS record_count
    FROM records
    WHERE user_id = $1
      AND record_date >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', record_date)
) AS monthly_data
ORDER BY month;

-- ============================================
-- 11. 유지보수 쿼리
-- ============================================

-- 11.1 중복 제거 (제목과 날짜가 같은 경우)
DELETE FROM records
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY user_id, title, record_date 
                ORDER BY created_at DESC
            ) AS rn
        FROM records
        WHERE user_id = $1
    ) t
    WHERE rn > 1
);

-- 11.2 빈 태그 배열 정리
UPDATE records
SET tags = NULL
WHERE user_id = $1
  AND (tags IS NULL OR array_length(tags, 1) IS NULL);

-- 11.3 사용되지 않는 카테고리 찾기
SELECT c.name
FROM categories c
LEFT JOIN records r ON c.name = r.category AND c.user_id = r.user_id
WHERE c.user_id = $1
GROUP BY c.name
HAVING COUNT(r.id) = 0;
