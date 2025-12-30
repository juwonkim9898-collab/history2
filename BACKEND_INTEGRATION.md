# 백엔드 API 연동 가이드

## 개요

이 프로젝트는 FastAPI 백엔드와 연동되도록 수정되었습니다. 백엔드 API는 PostgreSQL 데이터베이스를 사용하여 사용자의 역사 기록을 저장하고 관리합니다.

## 백엔드 API 스펙

### 인증
- 현재는 임시로 `user_id`를 쿼리 파라미터로 전달합니다
- 프로덕션에서는 JWT 토큰 기반 인증으로 변경해야 합니다

### 엔드포인트

#### 1. 전체 기록 조회
```
GET /api/records?user_id={user_id}&page=1&limit=20&sort=date_desc
```

#### 2. 특정 기록 조회
```
GET /api/records/{id}?user_id={user_id}
```

#### 3. 날짜 범위로 기록 조회
```
GET /api/records/date-range?user_id={user_id}&start_date=2024-01-01&end_date=2024-12-31
```

#### 4. 태그로 기록 검색
```
GET /api/records/search/tags?user_id={user_id}&tags=조선,고구려&match_all=false
```

#### 5. 키워드로 기록 검색
```
GET /api/records/search/keyword?user_id={user_id}&q=검색어
```

#### 6. 사용자의 모든 태그 조회
```
GET /api/records/tags?user_id={user_id}
```

#### 7. 통계 조회
```
GET /api/records/stats?user_id={user_id}&period=month
```

## 데이터 구조

### HistoryEvent (백엔드)
```typescript
{
  id: number;
  user_id: string;
  content: string;  // JSON 문자열: { title, year, description, details }
  record_date: string;  // YYYY-MM-DD
  tags: string[];
}
```

### HistoryEventUI (프론트엔드)
```typescript
{
  id: number;
  user_id: string;
  content: string;
  record_date: string;
  tags: string[];
  parsed: {
    title: string;
    year: string;
    description: string;
    details: string;
  }
}
```

## 프론트엔드 설정

### 환경 변수
`.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
VITE_API_URL=http://localhost:8000
```

### 주요 변경사항

1. **types.ts**: 백엔드 API 응답 타입 추가
2. **services/db.ts**: API 호출 로직으로 변경
3. **data/koreanHistory.ts**: HistoryEventUI 타입에 맞게 수정
4. **components/Grimoire.tsx**: parsed 필드 사용
5. **App.tsx**: HistoryEventUI 타입 사용

## 백엔드 설정

### 필요한 패키지
```bash
pip install fastapi sqlalchemy psycopg2-binary uvicorn pydantic
```

### 데이터베이스 스키마
```sql
CREATE TABLE records (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    record_date DATE NOT NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_records_user_id ON records(user_id);
CREATE INDEX idx_records_record_date ON records(record_date);
CREATE INDEX idx_records_tags ON records USING GIN(tags);
```

### 백엔드 실행
```bash
uvicorn backend_api:app --reload --host 0.0.0.0 --port 8000
```

## 개발 모드

현재 프론트엔드는 로컬 데이터(`data/koreanHistory.ts`)를 사용합니다. 백엔드 API와 연동하려면:

1. 백엔드 서버를 실행합니다
2. `.env` 파일에 `VITE_API_URL`을 설정합니다
3. `services/db.ts`의 API 호출이 활성화됩니다

## TODO

- [ ] JWT 토큰 기반 인증 구현
- [ ] POST /api/records 엔드포인트 구현 (기록 추가)
- [ ] PUT /api/records/{id} 엔드포인트 구현 (기록 수정)
- [ ] DELETE /api/records/{id} 엔드포인트 구현 (기록 삭제)
- [ ] 에러 핸들링 개선
- [ ] 로딩 상태 UI 개선
- [ ] 오프라인 모드 지원 (Service Worker)
