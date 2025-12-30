-- ============================================
-- 한국 역사 그리모어 - PostgreSQL 데이터베이스 스키마
-- ============================================

-- 데이터베이스 생성 (선택사항)
-- CREATE DATABASE korean_history_grimoire;
-- \c korean_history_grimoire;

-- 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- 인덱스 생성
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- 코멘트 추가
COMMENT ON TABLE users IS '사용자 정보 테이블';
COMMENT ON COLUMN users.id IS '사용자 고유 ID';
COMMENT ON COLUMN users.username IS '사용자명';
COMMENT ON COLUMN users.email IS '이메일 주소';
COMMENT ON COLUMN users.password_hash IS '암호화된 비밀번호';

-- ============================================
-- 2. history_events 테이블 (역사 이벤트)
-- ============================================

CREATE TABLE history_events (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    year VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    details TEXT NOT NULL,
    tag VARCHAR(100),
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX idx_history_user_id ON history_events(user_id);
CREATE INDEX idx_history_tag ON history_events(tag);
CREATE INDEX idx_history_searched_at ON history_events(searched_at DESC);
CREATE INDEX idx_history_user_tag ON history_events(user_id, tag);
CREATE INDEX idx_history_user_searched ON history_events(user_id, searched_at DESC);

-- 코멘트 추가
COMMENT ON TABLE history_events IS '사용자가 추가한 역사 이벤트';
COMMENT ON COLUMN history_events.id IS '이벤트 고유 ID';
COMMENT ON COLUMN history_events.user_id IS '사용자 ID (외래키)';
COMMENT ON COLUMN history_events.title IS '이벤트 제목';
COMMENT ON COLUMN history_events.year IS '연도 (예: 1392년, 기원전 37년)';
COMMENT ON COLUMN history_events.description IS '간단한 설명';
COMMENT ON COLUMN history_events.details IS '상세 내용';
COMMENT ON COLUMN history_events.tag IS '검색 키워드 태그';
COMMENT ON COLUMN history_events.searched_at IS '검색/추가 시간';

-- ============================================
-- 3. search_history 테이블 (검색 기록)
-- ============================================

CREATE TABLE search_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    search_keyword VARCHAR(255) NOT NULL,
    results_count INT DEFAULT 0,
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_search_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX idx_search_user_id ON search_history(user_id);
CREATE INDEX idx_search_keyword ON search_history(search_keyword);
CREATE INDEX idx_search_searched_at ON search_history(searched_at DESC);

-- 코멘트 추가
COMMENT ON TABLE search_history IS '사용자 검색 기록';
COMMENT ON COLUMN search_history.search_keyword IS '검색한 키워드';
COMMENT ON COLUMN search_history.results_count IS '검색 결과 개수';

-- ============================================
-- 4. 트리거 함수 (자동 updated_at 업데이트)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- users 테이블 트리거
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- history_events 테이블 트리거
CREATE TRIGGER update_history_events_updated_at 
    BEFORE UPDATE ON history_events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. 유용한 함수들
-- ============================================

-- 연도를 숫자로 변환하는 함수 (정렬용)
CREATE OR REPLACE FUNCTION parse_year(year_str VARCHAR)
RETURNS INTEGER AS $$
BEGIN
    IF year_str LIKE '기원전%' THEN
        RETURN -CAST(regexp_replace(year_str, '[^0-9]', '', 'g') AS INTEGER);
    ELSE
        RETURN CAST(regexp_replace(year_str, '[^0-9]', '', 'g') AS INTEGER);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 시대 구분 함수
CREATE OR REPLACE FUNCTION get_period(year_str VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    year_num INTEGER;
BEGIN
    year_num := parse_year(year_str);
    
    IF year_num < 0 THEN
        RETURN '기원전';
    ELSIF year_num < 668 THEN
        RETURN '삼국시대';
    ELSIF year_num < 918 THEN
        RETURN '통일신라';
    ELSIF year_num < 1392 THEN
        RETURN '고려시대';
    ELSIF year_num < 1897 THEN
        RETURN '조선시대';
    ELSIF year_num < 1945 THEN
        RETURN '근현대';
    ELSE
        RETURN '현대';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 6. 뷰 (View) 생성
-- ============================================

-- 시대별 통계 뷰
CREATE OR REPLACE VIEW v_period_statistics AS
SELECT 
    user_id,
    get_period(year) AS period,
    COUNT(*) AS event_count
FROM history_events
GROUP BY user_id, get_period(year)
ORDER BY user_id, 
    CASE get_period(year)
        WHEN '기원전' THEN 1
        WHEN '삼국시대' THEN 2
        WHEN '통일신라' THEN 3
        WHEN '고려시대' THEN 4
        WHEN '조선시대' THEN 5
        WHEN '근현대' THEN 6
        WHEN '현대' THEN 7
    END;

-- 사용자별 통계 뷰
CREATE OR REPLACE VIEW v_user_statistics AS
SELECT 
    u.id AS user_id,
    u.username,
    COUNT(DISTINCT he.id) AS total_events,
    COUNT(DISTINCT he.tag) AS total_tags,
    MAX(he.searched_at) AS last_search_time
FROM users u
LEFT JOIN history_events he ON u.id = he.user_id
GROUP BY u.id, u.username;

-- ============================================
-- 7. 샘플 데이터 삽입
-- ============================================

-- 테스트 사용자 생성
INSERT INTO users (username, email, password_hash) 
VALUES 
    ('testuser', 'test@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456'),
    ('admin', 'admin@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456')
ON CONFLICT (username) DO NOTHING;

-- 샘플 역사 이벤트 추가
INSERT INTO history_events (user_id, title, year, description, details, tag) 
VALUES 
    (1, '조선 건국', '1392년', 
     '이성계가 고려를 멸망시키고 조선을 건국하다',
     '1392년 이성계(태조)가 위화도 회군 후 정권을 장악하고 고려를 멸망시켜 조선을 건국했습니다. 한양을 수도로 정하고 성리학을 국가 이념으로 삼았으며, 약 500년간 지속된 조선 왕조의 시작이었습니다.',
     '조선왕조'),
     
    (1, '한글 창제', '1443년',
     '세종대왕이 훈민정음(한글)을 창제하다',
     '1443년 세종대왕이 백성들이 쉽게 배우고 사용할 수 있는 문자인 훈민정음을 창제했습니다. "나랏말싸미 듕귁에 달아"로 시작하는 훈민정음 해례본은 한국어의 특성을 반영한 과학적인 문자 체계였습니다.',
     '조선왕조'),
     
    (1, '임진왜란', '1592년',
     '일본이 조선을 침입하여 7년간의 전쟁이 시작되다',
     '1592년 도요토미 히데요시가 명나라 정복을 위해 조선을 침입했습니다. 이순신의 거북선과 의병활동, 명군의 지원으로 일본군을 물리쳤으나 조선은 큰 피해를 입었습니다.',
     '조선왕조'),
     
    (1, '고구려 건국', '기원전 37년',
     '주몽이 고구려를 건국하다',
     '기원전 37년 부여에서 남하한 주몽(동명성왕)이 졸본에서 고구려를 건국했습니다. 삼국사기에 따르면 주몽은 활을 잘 쏘아 동명이라 불렸으며, 고구려는 한반도 최초의 강력한 통일 국가로 발전했습니다.',
     '고구려'),
     
    (1, '한국전쟁 발발', '1950년',
     '북한이 38선을 넘어 남침을 시작하다',
     '1950년 6월 25일 새벽 4시, 북한군이 38선 전역에서 남침을 개시했습니다. 소련제 탱크와 항공기로 무장한 북한군은 3일 만에 서울을 점령했고, 한국전쟁이 시작되었습니다.',
     '한국전쟁');

-- 검색 기록 추가
INSERT INTO search_history (user_id, search_keyword, results_count)
VALUES 
    (1, '조선', 5),
    (1, '고구려', 5),
    (1, '한국전쟁', 5);

-- ============================================
-- 8. 권한 설정 (선택사항)
-- ============================================

-- 애플리케이션 전용 사용자 생성
-- CREATE USER grimoire_app WITH PASSWORD 'your_secure_password';

-- 권한 부여
-- GRANT CONNECT ON DATABASE korean_history_grimoire TO grimoire_app;
-- GRANT USAGE ON SCHEMA public TO grimoire_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO grimoire_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO grimoire_app;

-- 향후 생성될 테이블에도 권한 자동 부여
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO grimoire_app;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO grimoire_app;

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
    u.username,
    he.title,
    he.year,
    he.tag,
    he.searched_at
FROM history_events he
JOIN users u ON he.user_id = u.id
ORDER BY parse_year(he.year);
