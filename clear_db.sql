-- PostgreSQL DB의 history 테이블 완전 삭제
-- 데이터베이스: testdb
-- 테이블: history

-- 1. 모든 데이터 삭제
DELETE FROM history;

-- 2. ID 시퀀스 초기화 (선택사항)
ALTER SEQUENCE history_id_seq RESTART WITH 1;

-- 3. 확인
SELECT COUNT(*) as total_records FROM history;
SELECT * FROM history LIMIT 10;
