-- ============================================
-- 한국 역사 그리모어 - PostgreSQL 주요 쿼리
-- ============================================

-- ============================================
-- 1. 기본 CRUD 쿼리
-- ============================================

-- 1.1 모든 역사 이벤트 조회 (연도순 정렬)
SELECT 
    id,
    title,
    year,
    description,
    details,
    tag,
    searched_at
FROM history_events
WHERE user_id = $1
ORDER BY parse_year(year) ASC;

-- 1.2 특정 이벤트 조회
SELECT * FROM history_events
WHERE id = $1 AND user_id = $2;

-- 1.3 이벤트 추가
INSERT INTO history_events (
    user_id, title, year, description, details, tag, searched_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
)
RETURNING id, title, year, tag, searched_at;

-- 1.4 이벤트 수정
UPDATE history_events
SET 
    title = $1,
    year = $2,
    description = $3,
    details = $4,
    tag = $5
WHERE id = $6 AND user_id = $7
RETURNING *;

-- 1.5 이벤트 삭제
DELETE FROM history_events
WHERE id = $1 AND user_id = $2;

-- 1.6 모든 이벤트 삭제 (사용자별)
DELETE FROM history_events
WHERE user_id = $1;

-- ============================================
-- 2. 검색 및 필터링
-- ============================================

-- 2.1 키워드로 검색
SELECT * FROM history_events
WHERE user_id = $1
  AND (
    title ILIKE '%' || $2 || '%'
    OR description ILIKE '%' || $2 || '%'
    OR year ILIKE '%' || $2 || '%'
  )
ORDER BY searched_at DESC;

-- 2.2 태그로 필터링
SELECT * FROM history_events
WHERE user_id = $1 AND tag = $2
ORDER BY parse_year(year) ASC;

-- 2.3 날짜 범위로 검색
SELECT * FROM history_events
WHERE user_id = $1
  AND searched_at BETWEEN $2 AND $3
ORDER BY searched_at DESC;

-- 2.4 시대별 필터링
SELECT * FROM history_events
WHERE user_id = $1
  AND get_period(year) = $2
ORDER BY parse_year(year) ASC;

-- ============================================
-- 3. 태그 관련 쿼리
-- ============================================

-- 3.1 모든 태그 조회
SELECT DISTINCT tag
FROM history_events
WHERE user_id = $1 AND tag IS NOT NULL
ORDER BY tag;

-- 3.2 태그별 이벤트 개수
SELECT 
    tag,
    COUNT(*) AS event_count
FROM history_events
WHERE user_id = $1 AND tag IS NOT NULL
GROUP BY tag
ORDER BY event_count DESC, tag;

-- 3.3 특정 태그 존재 여부 확인
SELECT EXISTS(
    SELECT 1 FROM history_events
    WHERE user_id = $1 AND tag = $2
) AS has_tag;

-- ============================================
-- 4. 통계 쿼리
-- ============================================

-- 4.1 전체 통계
SELECT 
    COUNT(*) AS total_events,
    COUNT(DISTINCT tag) AS total_tags,
    MIN(searched_at) AS first_search,
    MAX(searched_at) AS last_search
FROM history_events
WHERE user_id = $1;

-- 4.2 시대별 통계
SELECT 
    get_period(year) AS period,
    COUNT(*) AS event_count
FROM history_events
WHERE user_id = $1
GROUP BY get_period(year)
ORDER BY 
    CASE get_period(year)
        WHEN '기원전' THEN 1
        WHEN '삼국시대' THEN 2
        WHEN '통일신라' THEN 3
        WHEN '고려시대' THEN 4
        WHEN '조선시대' THEN 5
        WHEN '근현대' THEN 6
        WHEN '현대' THEN 7
    END;

-- 4.3 월별 검색 통계
SELECT 
    DATE_TRUNC('month', searched_at) AS month,
    COUNT(*) AS search_count
FROM history_events
WHERE user_id = $1
GROUP BY DATE_TRUNC('month', searched_at)
ORDER BY month DESC;

-- 4.4 최근 검색한 이벤트 (Top 10)
SELECT 
    title,
    year,
    tag,
    searched_at
FROM history_events
WHERE user_id = $1
ORDER BY searched_at DESC
LIMIT 10;

-- 4.5 가장 많이 검색한 태그 (Top 5)
SELECT 
    tag,
    COUNT(*) AS count
FROM history_events
WHERE user_id = $1 AND tag IS NOT NULL
GROUP BY tag
ORDER BY count DESC
LIMIT 5;

-- ============================================
-- 5. 중복 체크
-- ============================================

-- 5.1 제목과 연도로 중복 체크
SELECT COUNT(*) AS duplicate_count
FROM history_events
WHERE user_id = $1
  AND title = $2
  AND year = $3;

-- 5.2 중복 이벤트 찾기
SELECT 
    title,
    year,
    COUNT(*) AS count
FROM history_events
WHERE user_id = $1
GROUP BY title, year
HAVING COUNT(*) > 1;

-- 5.3 중복 제거 (최신 것만 남기기)
DELETE FROM history_events
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY user_id, title, year 
                ORDER BY searched_at DESC
            ) AS rn
        FROM history_events
        WHERE user_id = $1
    ) t
    WHERE rn > 1
);

-- ============================================
-- 6. 검색 기록 관련
-- ============================================

-- 6.1 검색 기록 추가
INSERT INTO search_history (user_id, search_keyword, results_count)
VALUES ($1, $2, $3)
RETURNING id, search_keyword, searched_at;

-- 6.2 최근 검색 기록 조회
SELECT 
    search_keyword,
    results_count,
    searched_at
FROM search_history
WHERE user_id = $1
ORDER BY searched_at DESC
LIMIT 20;

-- 6.3 인기 검색어 (Top 10)
SELECT 
    search_keyword,
    COUNT(*) AS search_count,
    MAX(searched_at) AS last_searched
FROM search_history
WHERE user_id = $1
GROUP BY search_keyword
ORDER BY search_count DESC
LIMIT 10;

-- ============================================
-- 7. 사용자 관련
-- ============================================

-- 7.1 사용자 생성
INSERT INTO users (username, email, password_hash)
VALUES ($1, $2, $3)
RETURNING id, username, email, created_at;

-- 7.2 사용자 조회 (로그인)
SELECT 
    id,
    username,
    email,
    password_hash,
    created_at
FROM users
WHERE email = $1;

-- 7.3 사용자 정보 수정
UPDATE users
SET 
    username = COALESCE($1, username),
    email = COALESCE($2, email)
WHERE id = $3
RETURNING id, username, email, updated_at;

-- 7.4 비밀번호 변경
UPDATE users
SET password_hash = $1
WHERE id = $2
RETURNING id, updated_at;

-- ============================================
-- 8. 고급 쿼리
-- ============================================

-- 8.1 연도 범위로 이벤트 검색
SELECT * FROM history_events
WHERE user_id = $1
  AND parse_year(year) BETWEEN $2 AND $3
ORDER BY parse_year(year) ASC;

-- 8.2 전체 텍스트 검색 (Full Text Search)
SELECT 
    id,
    title,
    year,
    description,
    ts_rank(
        to_tsvector('korean', title || ' ' || description || ' ' || details),
        plainto_tsquery('korean', $2)
    ) AS rank
FROM history_events
WHERE user_id = $1
  AND to_tsvector('korean', title || ' ' || description || ' ' || details) 
      @@ plainto_tsquery('korean', $2)
ORDER BY rank DESC;

-- 8.3 페이지네이션
SELECT * FROM history_events
WHERE user_id = $1
ORDER BY searched_at DESC
LIMIT $2 OFFSET $3;

-- 8.4 태그별 최신 이벤트
SELECT DISTINCT ON (tag)
    id,
    title,
    year,
    tag,
    searched_at
FROM history_events
WHERE user_id = $1 AND tag IS NOT NULL
ORDER BY tag, searched_at DESC;

-- 8.5 시대별 이벤트 개수와 최신 이벤트
SELECT 
    get_period(year) AS period,
    COUNT(*) AS event_count,
    MAX(searched_at) AS last_added,
    array_agg(title ORDER BY searched_at DESC) FILTER (WHERE title IS NOT NULL) AS recent_titles
FROM history_events
WHERE user_id = $1
GROUP BY get_period(year)
ORDER BY 
    CASE get_period(year)
        WHEN '기원전' THEN 1
        WHEN '삼국시대' THEN 2
        WHEN '통일신라' THEN 3
        WHEN '고려시대' THEN 4
        WHEN '조선시대' THEN 5
        WHEN '근현대' THEN 6
        WHEN '현대' THEN 7
    END;

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
    'events', json_agg(
        json_build_object(
            'title', he.title,
            'year', he.year,
            'description', he.description,
            'details', he.details,
            'tag', he.tag,
            'searched_at', he.searched_at
        ) ORDER BY parse_year(he.year)
    )
) AS export_data
FROM users u
LEFT JOIN history_events he ON u.id = he.user_id
WHERE u.id = $1
GROUP BY u.id, u.username, u.email;

-- 9.2 백업용 전체 데이터 조회
SELECT 
    he.*,
    u.username,
    u.email
FROM history_events he
JOIN users u ON he.user_id = u.id
WHERE he.user_id = $1
ORDER BY he.searched_at DESC;

-- ============================================
-- 10. 유지보수 쿼리
-- ============================================

-- 10.1 테이블 크기 확인
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 10.2 인덱스 사용 통계
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- 10.3 느린 쿼리 분석 (EXPLAIN ANALYZE)
EXPLAIN ANALYZE
SELECT * FROM history_events
WHERE user_id = 1
ORDER BY parse_year(year) ASC;

-- 10.4 데이터베이스 통계
SELECT 
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM history_events) AS total_events,
    (SELECT COUNT(*) FROM search_history) AS total_searches,
    (SELECT COUNT(DISTINCT tag) FROM history_events WHERE tag IS NOT NULL) AS unique_tags;
