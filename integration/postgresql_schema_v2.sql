-- ============================================
-- 한국 역사 그리모어 - PostgreSQL 데이터베이스 스키마 v2
-- 범용 기록 시스템 (메인 페이지 → 히스토리 연동)
-- ============================================

-- ============================================
-- 1. users 테이블 (사용자)
-- ============================================

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

COMMENT ON TABLE users IS '사용자 정보 테이블';

-- ============================================
-- 2. records 테이블 (기록 - 메인 테이블)
-- ============================================

CREATE TABLE records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    record_date DATE,
    category VARCHAR(100),
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX idx_records_user_id ON records(user_id);
CREATE INDEX idx_records_record_date ON records(record_date DESC);
CREATE INDEX idx_records_category ON records(category);
CREATE INDEX idx_records_tags ON records USING GIN(tags);
CREATE INDEX idx_records_user_date ON records(user_id, record_date DESC);

COMMENT ON TABLE records IS '사용자 기록 메인 테이블';
COMMENT ON COLUMN records.title IS '기록 제목';
COMMENT ON COLUMN records.content IS '기록 내용 (본문)';
COMMENT ON COLUMN records.record_date IS '기록 날짜 (사용자 지정)';
COMMENT ON COLUMN records.category IS '카테고리 (예: 일기, 메모, 학습 등)';
COMMENT ON COLUMN records.tags IS '태그 배열';

-- ============================================
-- 3. record_attachments 테이블 (첨부파일)
-- ============================================

CREATE TABLE record_attachments (
    id BIGSERIAL PRIMARY KEY,
    record_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_record
        FOREIGN KEY (record_id) 
        REFERENCES records(id) 
        ON DELETE CASCADE
);

CREATE INDEX idx_attachments_record_id ON record_attachments(record_id);

COMMENT ON TABLE record_attachments IS '기록 첨부파일';

-- ============================================
-- 4. categories 테이블 (카테고리 관리)
-- ============================================

CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7),                           -- 색상 코드 (예: #FF5733)
    icon VARCHAR(50),                           -- 아이콘 이름
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_category_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    
    UNIQUE(user_id, name)
);

CREATE INDEX idx_categories_user_id ON categories(user_id);

COMMENT ON TABLE categories IS '사용자 정의 카테고리';

-- ============================================
-- 5. 트리거 함수 (자동 updated_at 업데이트)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_records_updated_at 
    BEFORE UPDATE ON records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. 유용한 함수들
-- ============================================

-- 날짜 범위로 기록 개수 조회
CREATE OR REPLACE FUNCTION get_record_count_by_date_range(
    p_user_id BIGINT,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM records
        WHERE user_id = p_user_id
          AND record_date BETWEEN p_start_date AND p_end_date
    );
END;
$$ LANGUAGE plpgsql;

-- 월별 기록 통계
CREATE OR REPLACE FUNCTION get_monthly_statistics(p_user_id BIGINT, p_year INT)
RETURNS TABLE(
    month INT,
    record_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(MONTH FROM record_date)::INT AS month,
        COUNT(*) AS record_count
    FROM records
    WHERE user_id = p_user_id
      AND EXTRACT(YEAR FROM record_date) = p_year
    GROUP BY EXTRACT(MONTH FROM record_date)
    ORDER BY month;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. 뷰 (View) 생성
-- ============================================

-- 카테고리별 통계 뷰
CREATE OR REPLACE VIEW v_category_statistics AS
SELECT 
    user_id,
    category,
    COUNT(*) AS record_count,
    MAX(record_date) AS last_record_date
FROM records
WHERE category IS NOT NULL
GROUP BY user_id, category;

-- 월별 기록 통계 뷰
CREATE OR REPLACE VIEW v_monthly_statistics AS
SELECT 
    user_id,
    DATE_TRUNC('month', record_date) AS month,
    COUNT(*) AS record_count
FROM records
WHERE record_date IS NOT NULL
GROUP BY user_id, DATE_TRUNC('month', record_date);

-- 사용자별 전체 통계 뷰
CREATE OR REPLACE VIEW v_user_statistics AS
SELECT 
    u.id AS user_id,
    u.username,
    COUNT(r.id) AS total_records,
    COUNT(DISTINCT r.category) AS category_count,
    MIN(r.record_date) AS first_record_date,
    MAX(r.record_date) AS last_record_date,
    MAX(r.created_at) AS last_created_at
FROM users u
LEFT JOIN records r ON u.id = r.user_id
GROUP BY u.id, u.username;

-- ============================================
-- 8. 기본 카테고리 데이터
-- ============================================

-- 테스트 사용자 생성
INSERT INTO users (username, email, password_hash) 
VALUES 
    ('testuser', 'test@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456')
ON CONFLICT (username) DO NOTHING;

-- 기본 카테고리 추가 (사용자 ID 1 기준)
INSERT INTO categories (user_id, name, color, icon, display_order)
VALUES 
    (1, '일기', '#FF6B6B', '📔', 1),
    (1, '메모', '#4ECDC4', '📝', 2),
    (1, '학습', '#45B7D1', '📚', 3),
    (1, '아이디어', '#FFA07A', '💡', 4),
    (1, '여행', '#98D8C8', '✈️', 5)
ON CONFLICT (user_id, name) DO NOTHING;

-- ============================================
-- 9. 샘플 데이터
-- ============================================

-- 샘플 기록 추가
INSERT INTO records (user_id, title, content, record_date, category, tags)
VALUES 
    (1, '프로젝트 시작', 
     '오늘부터 새로운 프로젝트를 시작했다. 한국 역사 그리모어 앱을 만들기로 했다.',
     '2025-12-01', '학습', ARRAY['프로젝트', '개발', '시작']),
     
    (1, '첫 번째 기능 완성',
     '검색 기능을 완성했다. 사용자가 키워드를 입력하면 관련 내용을 찾아준다.',
     '2025-12-15', '학습', ARRAY['개발', '기능', '완성']),
     
    (1, '데이터베이스 설계',
     'PostgreSQL로 데이터베이스를 설계했다. 사용자 기록을 효율적으로 저장할 수 있게 되었다.',
     '2025-12-20', '학습', ARRAY['데이터베이스', 'PostgreSQL']),
     
    (1, '오늘의 생각',
     '개발하면서 많은 것을 배우고 있다. 매일 조금씩 성장하는 느낌이 좋다.',
     '2025-12-25', '일기', ARRAY['생각', '성장']),
     
    (1, '새로운 아이디어',
     '사용자가 직접 카테고리를 만들 수 있게 하면 어떨까? 더 유연한 시스템이 될 것 같다.',
     '2025-12-28', '아이디어', ARRAY['기능', '개선']);

-- ============================================
-- 10. 권한 설정 (선택사항)
-- ============================================

-- 애플리케이션 전용 사용자 생성
-- CREATE USER grimoire_app WITH PASSWORD 'your_secure_password';

-- 권한 부여
-- GRANT CONNECT ON DATABASE korean_history_grimoire TO grimoire_app;
-- GRANT USAGE ON SCHEMA public TO grimoire_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO grimoire_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO grimoire_app;

-- ============================================
-- 완료!
-- ============================================

-- 테이블 목록 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 샘플 데이터 확인
SELECT 
    r.id,
    r.title,
    r.record_date,
    r.category,
    r.tags,
    r.created_at
FROM records r
WHERE r.user_id = 1
ORDER BY r.record_date DESC;

-- 통계 확인
SELECT * FROM v_user_statistics WHERE user_id = 1;
SELECT * FROM v_category_statistics WHERE user_id = 1;
