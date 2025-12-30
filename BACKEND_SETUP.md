# 백엔드 설정 가이드

## PostgreSQL 연결 정보

```
Host: 192.168.0.163
Port: 5432
Database: testdb
User: tuser
Password: test123
```

## 1. 필요한 패키지 설치

```bash
pip install fastapi uvicorn sqlalchemy psycopg2-binary pyjwt python-multipart
```

## 2. 데이터베이스 테이블 생성

```bash
python models.py
```

또는 SQL로 직접 생성:

```sql
CREATE TABLE IF NOT EXISTS history (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    record_date DATE NOT NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_history_user_id ON history(user_id);
CREATE INDEX idx_history_record_date ON history(record_date);
CREATE INDEX idx_history_tags ON history USING GIN(tags);
```

## 3. 백엔드 서버 실행

```bash
# 방법 1: uvicorn 직접 실행
uvicorn main:app --reload --host 127.0.0.1 --port 8000

# 방법 2: Python으로 실행
python main.py
```

## 4. API 테스트

### 토큰 발급
```bash
curl http://127.0.0.1:8000/generate-test-token
```

응답:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 기록 조회
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://127.0.0.1:8000/api/records
```

### 기록 생성
```bash
curl -X POST http://127.0.0.1:8000/api/records \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "{\"title\":\"테스트\",\"year\":\"2024년\",\"description\":\"설명\",\"details\":\"상세내용\"}",
    "record_date": "2024-12-29",
    "tags": ["테스트", "샘플"]
  }'
```

## 5. 연결 확인

### PostgreSQL 연결 테스트
```bash
psql -h 192.168.0.163 -p 5432 -U tuser -d testdb
```

### 데이터 확인
```sql
SELECT * FROM history;
SELECT COUNT(*) FROM history;
```

## 6. 문제 해결

### 연결 오류
```
sqlalchemy.exc.OperationalError: could not connect to server
```

**해결 방법:**
1. PostgreSQL 서버가 실행 중인지 확인
2. 방화벽 설정 확인 (포트 5432 열림)
3. `pg_hba.conf`에서 원격 접속 허용 확인
4. IP 주소와 포트 번호 확인

### 인증 오류
```
psycopg2.OperationalError: FATAL: password authentication failed
```

**해결 방법:**
1. 사용자 이름과 비밀번호 확인
2. PostgreSQL에서 사용자 권한 확인:
```sql
SELECT * FROM pg_user WHERE usename = 'tuser';
GRANT ALL PRIVILEGES ON DATABASE testdb TO tuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tuser;
GRANT ALL PRIVILEGES ON TABLE history TO tuser;
```

### CORS 오류
```
Access to fetch has been blocked by CORS policy
```

**해결 방법:**
- `main.py`의 CORS 설정에 프론트엔드 URL 추가
- 브라우저 캐시 삭제

## 7. 프로덕션 배포

### 환경 변수 사용
```python
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://tuser:test123@192.168.0.163:5432/testdb"
)

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")
```

### .env 파일 생성
```env
DATABASE_URL=postgresql://tuser:test123@192.168.0.163:5432/testdb
JWT_SECRET_KEY=your-super-secret-key-change-this
```

### 서버 실행 (프로덕션)
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 8. 로그 확인

백엔드 실행 시 다음과 같은 로그가 표시됩니다:

```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

SQL 쿼리 로그 (echo=True):
```
SELECT records.id, records.user_id, records.content, ...
FROM records
WHERE records.user_id = 'test_user'
```

## 9. 데이터베이스 초기 데이터

테스트용 데이터 삽입:

```sql
INSERT INTO history (user_id, content, record_date, tags)
VALUES 
  ('user123', '{"title":"조선 건국","year":"1392년","description":"이성계가 조선을 건국하다","details":"상세 내용..."}', '2024-12-29', ARRAY['조선', '건국']),
  ('user123', '{"title":"한글 창제","year":"1443년","description":"세종대왕이 한글을 창제하다","details":"상세 내용..."}', '2024-12-29', ARRAY['조선', '한글', '세종대왕']);
```

## 10. API 문서

서버 실행 후 다음 URL에서 자동 생성된 API 문서 확인:

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc
