# API 명세서 (API Specification) - TBD

## 📋 개요

**⚠️ 현재 상태**: 이 명세서는 **TBD (To Be Determined)** 상태입니다.

- **현재 구현**: 로컬 데이터(`data/koreanHistory.ts`)와 LocalStorage를 사용하여 클라이언트 측에서 동작
- **향후 계획**: 실제 데이터베이스 및 백엔드 API 구현 시 이 명세서는 변경될 수 있음
- **미확정 사항**: 엔드포인트, 요청/응답 구조, 에러 처리 방식, 인증 방식 등

**버전**: 0.1.0-draft  
**최종 수정일**: 2025-12-26  
**상태**: 초안 (Draft)

---

## 🔑 범례

- 🔶 **TBD**: 확정되지 않음, 변경 가능
- ✅ **확정**: 현재 구현 기준으로 확정
- 🚧 **검토 중**: 논의 필요
- `[TBD]`: 해당 필드/파라미터는 향후 추가 가능

---

## 📌 API 엔드포인트 목록

| # | 엔드포인트 | Method | 상태 | 설명 |
|---|-----------|--------|------|------|
| 1 | `/api/history/search` | POST | 🔶 TBD | history 이벤트 검색 |
| 2 | `/api/history` | GET | 🔶 TBD | 전체 기록 조회 |
| 3 | `/api/history` | POST | 🔶 TBD | 기록 저장 |
| 4 | `/api/history` | DELETE | 🔶 TBD | 기록 삭제 |
| 5 | `/api/history/search` | GET | 🔶 TBD | 키워드 검색 |
| 6 | `/api/history/stats` | GET | 🔶 TBD | 통계 조회 |
| 7 | `/api/history/tags` | GET | 🔶 TBD | 태그 목록 조회 |
| 8 | `/api/history/filter` | GET | 🔶 TBD | 태그별 필터링 |
| 9 | `/api/history/tags/check` | GET | 🔶 TBD | 태그 중복 확인 |

---

## 1️⃣ 역사 이벤트 검색 API

**상태**: 🔶 TBD

### Endpoint
```
POST /api/history/search  [TBD]
```

### 미확정 사항
- [ ] 페이지네이션 필요 여부
- [ ] 정렬 옵션 (연도순, 관련도순)
- [ ] 필터링 옵션 (시대별, 카테고리별)
- [ ] 검색 알고리즘 (정확도 vs 유사도)

### Request Body (현재)
```json
{
  "topic": "string"  // 필수
}
```

### Request Body (향후 확장 가능)
```json
{
  "topic": "string",
  "page": "number",        // [TBD]
  "limit": "number",       // [TBD]
  "sortBy": "string",      // [TBD] year, relevance
  "period": "string"       // [TBD] 시대 필터
}
```

### Response (현재)
```json
{
  "success": true,
  "data": [
    {
      "title": "string",
      "year": "string",
      "description": "string",
      "details": "string"
    }
  ],
  "count": "number"
}
```

### Response (향후 확장 가능)
```json
{
  "success": true,
  "data": [
    {
      "id": "string",          // [TBD] DB ID
      "title": "string",
      "year": "string",
      "description": "string",
      "details": "string",
      "category": "string",    // [TBD]
      "tags": ["string"],      // [TBD]
      "imageUrl": "string",    // [TBD]
      "sources": ["string"]    // [TBD]
    }
  ],
  "count": "number",
  "totalCount": "number",      // [TBD]
  "page": "number",            // [TBD]
  "totalPages": "number"       // [TBD]
}
```

---

## 2️⃣ 전체 기록 조회 API

**상태**: 🔶 TBD

### Endpoint
```
GET /api/history  [TBD]
```

### 미확정 사항
- [ ] 대량 데이터 처리 방식 (페이지네이션 필수?)
- [ ] 캐싱 전략
- [ ] 응답 데이터 최적화 (필드 선택 옵션)
- [ ] 정렬 기준 (연도순, 최신순, 인기순)

### Query Parameters (향후 추가 가능)
```
?page=1&limit=20&sortBy=year&order=asc&fields=title,year
```

---

## 3️⃣ 기록 저장 API

**상태**: 🔶 TBD

### Endpoint
```
POST /api/history  [TBD]
```

### 미확정 사항
- [ ] 인증/권한 필요 여부
- [ ] 데이터 검증 규칙
- [ ] 중복 체크 로직
- [ ] 이미지 업로드 처리
- [ ] 일괄 저장 vs 개별 저장

### Request Body (현재)
```json
{
  "events": [
    {
      "title": "string",
      "year": "string",
      "description": "string",
      "details": "string"
    }
  ],
  "searchTag": "string"  // 선택
}
```

### Request Body (향후 확장 가능)
```json
{
  "events": [...],
  "searchTag": "string",
  "userId": "string",        // [TBD] 인증 시
  "category": "string",      // [TBD]
  "tags": ["string"],        // [TBD]
  "imageFiles": ["file"]     // [TBD] 이미지 업로드
}
```

---

## 4️⃣ 기록 삭제 API

**상태**: 🔶 TBD

### Endpoint
```
DELETE /api/history           [TBD] 전체 삭제
DELETE /api/history/:id       [TBD] 개별 삭제
DELETE /api/history/batch     [TBD] 일괄 삭제
```

### 미확정 사항
- [ ] 전체 삭제 vs 개별 삭제 vs 일괄 삭제
- [ ] 소프트 삭제 vs 하드 삭제
- [ ] 삭제 권한 관리
- [ ] 삭제 이력 관리
- [ ] 복구 기능 필요 여부

---

## 5️⃣ 키워드 검색 API

**상태**: 🔶 TBD

### Endpoint
```
GET /api/history/search?q={query}  [TBD]
```

### 미확정 사항
- [ ] 전문 검색 엔진 사용 (Elasticsearch 등)
- [ ] 검색 알고리즘 (정확도, 관련도)
- [ ] 자동완성 기능
- [ ] 검색 히스토리 저장
- [ ] 인기 검색어 기능

### Query Parameters (향후 추가 가능)
```
?q=조선&page=1&limit=10&fuzzy=true&highlight=true
```

---

## 6️⃣ 통계 조회 API

**상태**: 🔶 TBD

### Endpoint
```
GET /api/history/stats  [TBD]
```

### 미확정 사항
- [ ] 통계 종류 (시대별, 카테고리별, 월별)
- [ ] 실시간 통계 vs 캐시된 통계
- [ ] 사용자별 통계
- [ ] 검색 통계
- [ ] 인기 이벤트 통계

### Response (현재)
```json
{
  "success": true,
  "data": {
    "totalEvents": "number",
    "periods": {
      "기원전": "number",
      "삼국시대": "number",
      "조선시대": "number"
    }
  }
}
```

### Response (향후 확장 가능)
```json
{
  "success": true,
  "data": {
    "totalEvents": "number",
    "periods": {...},
    "categories": {...},         // [TBD]
    "recentSearches": [...],     // [TBD]
    "popularEvents": [...],      // [TBD]
    "lastUpdated": "string"      // [TBD]
  }
}
```

---

## 🔐 인증 (TBD)

**미확정 사항**:
- [ ] 인증 방식 (JWT, OAuth, Session)
- [ ] 권한 관리 (관리자, 일반 사용자)
- [ ] API 키 사용 여부
- [ ] Rate Limiting

---

## ⚠️ 에러 응답 (TBD)

### 현재 구현
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지"
  }
}
```

---

## 📊 데이터 모델 (TBD)

### HistoryEvent (현재)
```typescript
interface HistoryEvent {
  title: string;
  year: string;
  description: string;
  details: string;
  tag?: string;
  searchedAt?: number;
}
```

### HistoryEvent (향후 확장 가능)
```typescript
interface HistoryEvent {
  id: string;                    // [TBD] DB ID
  title: string;
  year: string;
  description: string;
  details: string;
  category?: string;             // [TBD]
  tags?: string[];               // [TBD]
  imageUrl?: string;             // [TBD]
  sources?: string[];            // [TBD]
  createdAt?: string;            // [TBD]
  updatedAt?: string;            // [TBD]
}
```

---

## 📝 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2025-12-26 | 0.1.0-draft | 초안 작성 (TBD 버전) |
