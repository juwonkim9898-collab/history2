# 문제 해결 가이드

## 문제: DB에 데이터가 있는데 프론트엔드에서 안 보임

### 1단계: 백엔드 서버 확인

```bash
# 백엔드가 실행 중인지 확인
curl http://127.0.0.1:8000/health
```

**예상 응답:**
```json
{"status":"ok","message":"API is running"}
```

### 2단계: 토큰 발급 테스트

```bash
curl http://127.0.0.1:8000/generate-test-token
```

**예상 응답:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": "user123",
  "expires_in": "7 days"
}
```

### 3단계: API로 직접 데이터 조회

```bash
# 토큰을 변수에 저장
TOKEN="여기에_위에서_받은_토큰_붙여넣기"

# 기록 조회
curl -H "Authorization: Bearer $TOKEN" \
     http://127.0.0.1:8000/api/records
```

**예상 응답:**
```json
{
  "success": true,
  "data": {
    "records": [...],
    "pagination": {...}
  }
}
```

### 4단계: DB에서 user_id 확인

```sql
-- DBeaver에서 실행
SELECT user_id, COUNT(*) 
FROM history 
GROUP BY user_id;
```

**문제 원인:**
- DB의 `user_id`가 `user123`이 아닐 수 있음
- 백엔드 토큰의 `user_id`는 `user123`

**해결 방법 1: DB 데이터의 user_id 변경**
```sql
UPDATE history 
SET user_id = 'user123' 
WHERE user_id != 'user123';
```

**해결 방법 2: 백엔드 토큰의 user_id 변경**
`main.py`의 `generate_test_token()` 함수에서:
```python
payload = {
    "user_id": "실제_DB의_user_id",  # 여기를 DB의 user_id로 변경
    "exp": datetime.utcnow() + timedelta(days=7)
}
```

### 5단계: 브라우저 개발자 도구 확인

1. 프론트엔드 실행: `npm run dev`
2. 브라우저에서 F12 → Console 탭
3. 다음 로그 확인:

```
🔄 loadHistory 시작...
🔵 API 호출: http://127.0.0.1:8000/api/records?page=1&limit=100&sort=date_desc
🔑 토큰: eyJhbGciOiJIUzI1NiIs...
📡 응답 상태: 200 OK
✅ API 응답: {success: true, data: {...}}
📚 받은 데이터: {records: Array(5), pagination: {...}}
📚 변환된 데이터: Array(5)
📊 불러온 기록: 5 개
```

### 6단계: CORS 오류 확인

**오류 메시지:**
```
Access to fetch at 'http://127.0.0.1:8000/api/records' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**해결 방법:**
`main.py`에서 CORS 설정 확인:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 또는 ["http://localhost:5173", "http://127.0.0.1:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 7단계: 네트워크 탭 확인

1. F12 → Network 탭
2. 페이지 새로고침
3. `/api/records` 요청 확인
4. Response 탭에서 실제 응답 데이터 확인

### 8단계: 테스트 HTML 사용

`test_api.html` 파일을 브라우저에서 열기:
1. 파일 탐색기에서 `test_api.html` 더블클릭
2. "1. 토큰 발급" 버튼 클릭
3. "2. 기록 조회" 버튼 클릭
4. 결과 확인

## 일반적인 문제들

### 문제 1: 백엔드가 실행되지 않음
```bash
# 백엔드 실행
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 문제 2: DB 연결 오류
```
sqlalchemy.exc.OperationalError: could not connect to server
```

**확인 사항:**
- PostgreSQL 서버 실행 중?
- IP: 192.168.0.163, Port: 5432 접근 가능?
- 방화벽 설정?

```bash
# PostgreSQL 연결 테스트
psql -h 192.168.0.163 -p 5432 -U tuser -d testdb
```

### 문제 3: 테이블이 없음
```
relation "history" does not exist
```

**해결:**
```bash
python models.py
```

또는:
```sql
CREATE TABLE history (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    record_date DATE NOT NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 문제 4: user_id 불일치

**확인:**
```sql
SELECT DISTINCT user_id FROM history;
```

**수정:**
```sql
-- 모든 기록의 user_id를 user123으로 변경
UPDATE history SET user_id = 'user123';
```

### 문제 5: 프론트엔드가 로컬 데이터 사용 중

`services/geminiService.ts`가 로컬 데이터를 반환하고 있을 수 있습니다.

**확인:**
- 검색 기능이 작동하는가? → 로컬 데이터 사용 중
- 페이지 로드 시 기록이 없는가? → API 호출 실패

## 성공 확인

다음이 모두 표시되면 성공:

1. ✅ 백엔드 서버 실행 중
2. ✅ 토큰 발급 성공
3. ✅ API로 데이터 조회 성공
4. ✅ 브라우저 콘솔에 로그 표시
5. ✅ 프론트엔드에 데이터 표시

## 추가 도움

문제가 계속되면 다음 정보를 제공해주세요:

1. 백엔드 서버 로그
2. 브라우저 콘솔 로그
3. Network 탭의 API 응답
4. DB의 user_id 목록
