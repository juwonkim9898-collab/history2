# API 명세서 v3 - 히스토리 페이지 (최종)

## 개요
- **버전**: v3 (최종 확정)
- **기준 날짜**: 2025-12-29
- **대상**: 히스토리 페이지 (READ-ONLY)
- **데이터베이스**: PostgreSQL
- **인증**: JWT Bearer Token (예정)

## 테이블 구조

```
┌──────────────┬──────────────┬─────────────────────────────────┐
│   컬럼명      │    타입       │          설명                    │
├──────────────┼──────────────┼─────────────────────────────────┤
│ id           │ BIGINT       │ 기록 번호 (PK)                   │
│ user_id      │ VARCHAR(255) │ 사용자 ID (FK)                   │
│ content      │ TEXT         │ 기록 내용 (본문)                 │
│ record_date  │ DATE         │ 기록 날짜 (예: 2025-12-29)       │
│ tags         │ TEXT[]       │ 태그 배열 (예: ["개발", "학습"]) │
└──────────────┴──────────────┴─────────────────────────────────┘
```

## 중요 사항
- **히스토리 페이지는 READ-ONLY**: 조회(GET)만 가능
- **생성/수정/삭제는 메인 페이지에서 처리**: 히스토리 페이지에서는 불가능
- **메인 페이지와 동일한 DB 공유**: 메인 페이지에서 작성한 기록을 히스토리 페이지에서 조회

---

## API 엔드포인트

### 1. 전체 기록 조회
사용자의 모든 기록을 조회합니다.

**Endpoint**: `GET /api/records`

**Headers**:
```json
{
  "Authorization": "Bearer {access_token}"
}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|---------|------|------|------|------|
| page | integer | X | 페이지 번호 (기본값: 1) | 1 |
| limit | integer | X | 페이지당 항목 수 (기본값: 20, 최대: 100) | 20 |
| sort | string | X | 정렬 기준 (date_desc, date_asc) | date_desc |

**Request Example**:
```http
GET /api/records?page=1&limit=20&sort=date_desc
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": 1,
        "user_id": "user123",
        "content": "오늘은 React 프로젝트를 시작했다. 컴포넌트 구조를 설계하고 기본 레이아웃을 작성했다.",
        "record_date": "2025-12-29",
        "tags": ["개발", "React", "프론트엔드"]
      },
      {
        "id": 2,
        "user_id": "user123",
        "content": "알고리즘 문제 3개를 풀었다. 동적 프로그래밍 개념이 조금씩 이해되고 있다.",
        "record_date": "2025-12-28",
        "tags": ["학습", "알고리즘"]
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_records": 87,
      "limit": 20,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

**Error Response (401 Unauthorized)**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "인증이 필요합니다."
  }
}
```

---

### 2. 특정 기록 조회
ID로 특정 기록의 상세 정보를 조회합니다.

**Endpoint**: `GET /api/records/{id}`

**Headers**:
```json
{
  "Authorization": "Bearer {access_token}"
}
```

**Path Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| id | integer | O | 기록 ID |

**Request Example**:
```http
GET /api/records/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": "user123",
    "content": "오늘은 React 프로젝트를 시작했다. 컴포넌트 구조를 설계하고 기본 레이아웃을 작성했다.",
    "record_date": "2025-12-29",
    "tags": ["개발", "React", "프론트엔드"]
  }
}
```

**Error Response (404 Not Found)**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "해당 기록을 찾을 수 없습니다."
  }
}
```

**Error Response (403 Forbidden)**:
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "이 기록에 접근할 권한이 없습니다."
  }
}
```

---

### 3. 날짜 범위로 기록 조회
특정 날짜 범위의 기록을 조회합니다.

**Endpoint**: `GET /api/records/date-range`

**Headers**:
```json
{
  "Authorization": "Bearer {access_token}"
}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|---------|------|------|------|------|
| start_date | string (YYYY-MM-DD) | O | 시작 날짜 | 2025-12-01 |
| end_date | string (YYYY-MM-DD) | O | 종료 날짜 | 2025-12-31 |
| page | integer | X | 페이지 번호 | 1 |
| limit | integer | X | 페이지당 항목 수 | 20 |

**Request Example**:
```http
GET /api/records/date-range?start_date=2025-12-01&end_date=2025-12-31&page=1&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": 1,
        "user_id": "user123",
        "content": "오늘은 React 프로젝트를 시작했다.",
        "record_date": "2025-12-29",
        "tags": ["개발", "React"]
      }
    ],
    "date_range": {
      "start_date": "2025-12-01",
      "end_date": "2025-12-31"
    },
    "pagination": {
      "current_page": 1,
      "total_pages": 2,
      "total_records": 25,
      "limit": 20,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

---

### 4. 태그로 기록 검색
특정 태그를 포함하는 기록을 검색합니다.

**Endpoint**: `GET /api/records/search/tags`

**Headers**:
```json
{
  "Authorization": "Bearer {access_token}"
}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|---------|------|------|------|------|
| tags | string | O | 검색할 태그 (쉼표로 구분, OR 조건) | 개발,학습 |
| match_all | boolean | X | 모든 태그 포함 여부 (AND 조건, 기본값: false) | false |
| page | integer | X | 페이지 번호 | 1 |
| limit | integer | X | 페이지당 항목 수 | 20 |

**Request Example**:
```http
GET /api/records/search/tags?tags=개발,React&match_all=false&page=1&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": 1,
        "user_id": "user123",
        "content": "오늘은 React 프로젝트를 시작했다.",
        "record_date": "2025-12-29",
        "tags": ["개발", "React", "프론트엔드"]
      },
      {
        "id": 5,
        "user_id": "user123",
        "content": "TypeScript 설정을 완료했다.",
        "record_date": "2025-12-25",
        "tags": ["개발", "TypeScript"]
      }
    ],
    "search_criteria": {
      "tags": ["개발", "React"],
      "match_all": false
    },
    "pagination": {
      "current_page": 1,
      "total_pages": 1,
      "total_records": 15,
      "limit": 20,
      "has_next": false,
      "has_prev": false
    }
  }
}
```

---

### 5. 키워드로 기록 검색
기록 내용(content)에서 키워드를 검색합니다.

**Endpoint**: `GET /api/records/search/keyword`

**Headers**:
```json
{
  "Authorization": "Bearer {access_token}"
}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|---------|------|------|------|------|
| q | string | O | 검색 키워드 | React |
| page | integer | X | 페이지 번호 | 1 |
| limit | integer | X | 페이지당 항목 수 | 20 |

**Request Example**:
```http
GET /api/records/search/keyword?q=React&page=1&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": 1,
        "user_id": "user123",
        "content": "오늘은 React 프로젝트를 시작했다. 컴포넌트 구조를 설계하고 기본 레이아웃을 작성했다.",
        "record_date": "2025-12-29",
        "tags": ["개발", "React", "프론트엔드"]
      }
    ],
    "search_criteria": {
      "keyword": "React"
    },
    "pagination": {
      "current_page": 1,
      "total_pages": 1,
      "total_records": 8,
      "limit": 20,
      "has_next": false,
      "has_prev": false
    }
  }
}
```

---

### 6. 사용자의 모든 태그 조회
사용자가 사용한 모든 태그 목록을 조회합니다.

**Endpoint**: `GET /api/records/tags`

**Headers**:
```json
{
  "Authorization": "Bearer {access_token}"
}
```

**Request Example**:
```http
GET /api/records/tags
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "tag": "개발",
        "count": 45
      },
      {
        "tag": "학습",
        "count": 32
      },
      {
        "tag": "React",
        "count": 18
      },
      {
        "tag": "알고리즘",
        "count": 15
      },
      {
        "tag": "프론트엔드",
        "count": 12
      }
    ],
    "total_tags": 5
  }
}
```

---

### 7. 통계 조회
사용자의 기록 통계를 조회합니다.

**Endpoint**: `GET /api/records/stats`

**Headers**:
```json
{
  "Authorization": "Bearer {access_token}"
}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|---------|------|------|------|------|
| period | string | X | 통계 기간 (week, month, year, all) | month |

**Request Example**:
```http
GET /api/records/stats?period=month
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "period": "month",
    "total_records": 87,
    "records_in_period": 25,
    "most_used_tags": [
      {
        "tag": "개발",
        "count": 15
      },
      {
        "tag": "학습",
        "count": 10
      }
    ],
    "records_by_date": [
      {
        "date": "2025-12-29",
        "count": 3
      },
      {
        "date": "2025-12-28",
        "count": 2
      }
    ],
    "date_range": {
      "start_date": "2025-12-01",
      "end_date": "2025-12-31"
    }
  }
}
```

---

## 공통 에러 응답

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "잘못된 요청입니다.",
    "details": {
      "field": "start_date",
      "reason": "날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)"
    }
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "인증이 필요합니다."
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "접근 권한이 없습니다."
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "요청한 리소스를 찾을 수 없습니다."
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "서버 오류가 발생했습니다."
  }
}
```

---

## 데이터 타입 정의

### Record Object
```typescript
interface Record {
  id: number;              // 기록 ID
  user_id: string;         // 사용자 ID
  content: string;         // 기록 내용
  record_date: string;     // 기록 날짜 (YYYY-MM-DD)
  tags: string[];          // 태그 배열
}
```

### Pagination Object
```typescript
interface Pagination {
  current_page: number;    // 현재 페이지
  total_pages: number;     // 전체 페이지 수
  total_records: number;   // 전체 기록 수
  limit: number;           // 페이지당 항목 수
  has_next: boolean;       // 다음 페이지 존재 여부
  has_prev: boolean;       // 이전 페이지 존재 여부
}
```

---

## 구현 우선순위

### Phase 1 (필수)
1. ✅ 전체 기록 조회 (`GET /api/records`)
2. ✅ 특정 기록 조회 (`GET /api/records/{id}`)
3. ✅ 태그로 검색 (`GET /api/records/search/tags`)

### Phase 2 (중요)
4. ✅ 키워드 검색 (`GET /api/records/search/keyword`)
5. ✅ 모든 태그 조회 (`GET /api/records/tags`)

### Phase 3 (선택)
6. ✅ 날짜 범위 조회 (`GET /api/records/date-range`)
7. ✅ 통계 조회 (`GET /api/records/stats`)

---

## 참고사항

1. **인증**: 모든 API는 JWT Bearer Token 인증 필요
2. **권한**: 사용자는 자신의 기록만 조회 가능
3. **페이지네이션**: 기본 20개, 최대 100개까지 조회 가능
4. **정렬**: 기본적으로 최신순 정렬 (record_date DESC)
5. **태그 검색**: 대소문자 구분 없음, 부분 일치 지원
6. **날짜 형식**: ISO 8601 형식 (YYYY-MM-DD)
7. **응답 시간**: 평균 200ms 이하 목표

---

## 변경 이력

- **v3 (2025-12-29)**: 최종 확정 - 간소화된 테이블 구조 기반
  - 테이블 구조: id, user_id, content, record_date, tags
  - READ-ONLY API만 제공 (히스토리 페이지용)
  
- **v2 (2025-12-29)**: 범용 기록 시스템으로 변경
  - 한국사 특화 → 범용 기록 시스템
  - title, category, attachments 추가
  
- **v1 (2025-12-29)**: 초안 작성
  - 한국사 특화 구조 (title, year, description, details)
