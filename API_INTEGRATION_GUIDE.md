# API 연동 가이드

## 개요

프론트엔드는 JWT 토큰 기반 인증을 사용하여 백엔드 API와 통신합니다.

## API 설정

### 기본 URL
```
http://127.0.0.1:8000
```

### 인증 방식
- JWT Bearer Token 인증
- 토큰은 `/generate-test-token` 엔드포인트에서 자동으로 가져옵니다
- 모든 API 요청 헤더에 `Authorization: Bearer {token}` 포함

## 프론트엔드 구현

### services/db.ts

```typescript
// API 기본 URL
const API_BASE_URL = 'http://127.0.0.1:8000';

// 토큰 저장
let authToken: string | null = null;

// 토큰 가져오기 함수
async function getToken(): Promise<string> {
  if (!authToken) {
    const response = await fetch(`${API_BASE_URL}/generate-test-token`);
    const data = await response.json();
    authToken = data.token;
  }
  return authToken;
}

// API 호출 헬퍼 함수
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  // 응답 처리...
}
```

## API 엔드포인트

### 1. 토큰 생성 (테스트용)
```
GET /generate-test-token
```

**응답:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. 전체 기록 조회
```
GET /api/records?page=1&limit=20&sort=date_desc
Authorization: Bearer {token}
```

### 3. 기록 생성
```
POST /api/records
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "{\"title\":\"조선 건국\",\"year\":\"1392년\",\"description\":\"...\",\"details\":\"...\"}",
  "record_date": "2024-12-29",
  "tags": ["조선", "건국"]
}
```

### 4. 기록 삭제
```
DELETE /api/records/{id}
Authorization: Bearer {token}
```

### 5. 태그 검색
```
GET /api/records/search/tags?tags=조선,고구려&match_all=false
Authorization: Bearer {token}
```

### 6. 키워드 검색
```
GET /api/records/search/keyword?q=검색어
Authorization: Bearer {token}
```

### 7. 모든 태그 조회
```
GET /api/records/tags
Authorization: Bearer {token}
```

### 8. 통계 조회
```
GET /api/records/stats?period=month
Authorization: Bearer {token}
```

## 백엔드 요구사항

백엔드에서 다음 엔드포인트를 구현해야 합니다:

1. **토큰 생성 (테스트용)**
```python
@app.get("/generate-test-token")
def generate_test_token():
    # JWT 토큰 생성 로직
    token = create_jwt_token(user_id="test_user")
    return {"token": token}
```

2. **JWT 인증 미들웨어**
```python
from fastapi import Header, HTTPException

async def verify_token(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    
    token = authorization.replace("Bearer ", "")
    # JWT 검증 로직
    user_id = decode_jwt_token(token)
    return user_id
```

3. **CORS 설정**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 테스트 방법

### 1. 백엔드 서버 실행
```bash
cd /path/to/backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 2. 프론트엔드 개발 서버 실행
```bash
npm run dev
```

### 3. 브라우저에서 확인
- 개발자 도구(F12) → Network 탭
- API 요청 확인
- Authorization 헤더에 Bearer 토큰이 포함되어 있는지 확인

## 에러 처리

### 401 Unauthorized
- 토큰이 없거나 유효하지 않음
- `/generate-test-token`에서 새 토큰 발급

### 403 Forbidden
- 권한이 없는 리소스 접근
- 다른 사용자의 기록에 접근 시도

### 404 Not Found
- 존재하지 않는 기록 ID

### 500 Internal Server Error
- 서버 내부 오류
- 백엔드 로그 확인 필요

## 로컬 데이터 모드

백엔드 서버가 없어도 프론트엔드는 로컬 데이터로 동작합니다:
- `geminiService.ts`가 `koreanHistory.ts`의 데이터 사용
- 검색 기능은 정상 작동
- 저장/불러오기는 백엔드 필요

## 프로덕션 배포

1. 환경 변수 설정
```env
VITE_API_URL=https://your-api-domain.com
```

2. JWT 시크릿 키 설정 (백엔드)
```python
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION = 3600  # 1시간
```

3. HTTPS 사용
4. CORS 도메인 제한
