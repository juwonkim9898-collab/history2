# 기록 시스템 API 명세서 v2.0

## 개요
사용자가 메인 페이지에서 작성한 기록을 히스토리 페이지에서 조회하는 범용 기록 시스템 API

**Base URL**: `https://api.example.com/v1`  
**인증 방식**: JWT Bearer Token  
**응답 형식**: JSON  
**문자 인코딩**: UTF-8

---

## 목차
1. [인증 API](#1-인증-api)
2. [기록 API](#2-기록-api)
3. [카테고리 API](#3-카테고리-api)
4. [태그 API](#4-태그-api)
5. [통계 API](#5-통계-api)
6. [첨부파일 API](#6-첨부파일-api)
7. [에러 코드](#7-에러-코드)

---

## 1. 인증 API

### 1.1 회원가입
사용자 계정을 생성합니다.

**Endpoint**: `POST /auth/register`

**Request Body**:
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "securePassword123!"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "createdAt": "2025-12-29T10:30:00Z"
  },
  "message": "회원가입이 완료되었습니다."
}
```

---

### 1.2 로그인
JWT 토큰을 발급받습니다.

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "test@example.com",
  "password": "securePassword123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com"
    }
  },
  "message": "로그인 성공"
}
```

---

### 1.3 토큰 갱신
Refresh Token으로 새로운 Access Token을 발급받습니다.

**Endpoint**: `POST /auth/refresh`

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

---

## 2. 기록 API

### 2.1 기록 목록 조회
사용자의 모든 기록을 조회합니다.

**Endpoint**: `GET /records`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|---------|------|------|------|------|
| page | integer | X | 페이지 번호 (기본값: 1) | 1 |
| limit | integer | X | 페이지당 개수 (기본값: 20) | 20 |
| category | string | X | 카테고리 필터 | "일기" |
| tag | string | X | 태그 필터 | "개발" |
| favorite | boolean | X | 즐겨찾기만 조회 | true |
| startDate | date | X | 시작 날짜 (YYYY-MM-DD) | "2025-01-01" |
| endDate | date | X | 종료 날짜 (YYYY-MM-DD) | "2025-12-31" |
| search | string | X | 검색어 (제목/내용) | "프로젝트" |
| sort | string | X | 정렬 (date_desc, date_asc, created_desc) | "date_desc" |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": 1,
        "title": "프로젝트 시작",
        "content": "오늘부터 새로운 프로젝트를 시작했다...",
        "recordDate": "2025-12-01",
        "category": "학습",
        "tags": ["프로젝트", "개발", "시작"],
        "isFavorite": false,
        "createdAt": "2025-12-01T10:00:00Z",
        "updatedAt": "2025-12-01T10:00:00Z"
      },
      {
        "id": 2,
        "title": "첫 번째 기능 완성",
        "content": "검색 기능을 완성했다...",
        "recordDate": "2025-12-15",
        "category": "학습",
        "tags": ["개발", "기능", "완성"],
        "isFavorite": true,
        "createdAt": "2025-12-15T14:30:00Z",
        "updatedAt": "2025-12-15T14:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalRecords": 100,
      "limit": 20,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### 2.2 특정 기록 조회
ID로 특정 기록을 조회합니다.

**Endpoint**: `GET /records/:id`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "프로젝트 시작",
    "content": "오늘부터 새로운 프로젝트를 시작했다. 한국 역사 그리모어 앱을 만들기로 했다.",
    "recordDate": "2025-12-01",
    "category": "학습",
    "tags": ["프로젝트", "개발", "시작"],
    "isFavorite": false,
    "attachments": [
      {
        "id": 1,
        "fileName": "screenshot.png",
        "fileSize": 1024000,
        "mimeType": "image/png",
        "url": "https://cdn.example.com/files/screenshot.png"
      }
    ],
    "createdAt": "2025-12-01T10:00:00Z",
    "updatedAt": "2025-12-01T10:00:00Z"
  }
}
```

---

### 2.3 기록 생성
새로운 기록을 생성합니다. (메인 페이지 기록실에서 호출)

**Endpoint**: `POST /records`

**Headers**:
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Request Body** (Form Data):
```
title: "새로운 기록"
content: "오늘 배운 내용을 정리한다..."
recordDate: "2025-12-29"
category: "학습"
tags: ["학습", "정리"]  (JSON string)
isFavorite: false
files: [파일1, 파일2, ...]  (선택사항, 여러 파일 가능)
```

**JSON 형식 요청 (첨부파일 없는 경우)**:
```
Content-Type: application/json

{
  "title": "새로운 기록",
  "content": "오늘 배운 내용을 정리한다...",
  "recordDate": "2025-12-29",
  "category": "학습",
  "tags": ["학습", "정리"],
  "isFavorite": false
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 3,
    "title": "새로운 기록",
    "content": "오늘 배운 내용을 정리한다...",
    "recordDate": "2025-12-29",
    "category": "학습",
    "tags": ["학습", "정리"],
    "isFavorite": false,
    "attachments": [
      {
        "id": 1,
        "fileName": "image.jpg",
        "fileSize": 512000,
        "mimeType": "image/jpeg",
        "url": "https://cdn.example.com/files/image.jpg"
      }
    ],
    "createdAt": "2025-12-29T15:00:00Z",
    "updatedAt": "2025-12-29T15:00:00Z"
  },
  "message": "기록이 생성되었습니다."
}
```

---

### 2.4 기록 수정
기존 기록을 수정합니다. (메인 페이지 기록실에서 호출)

**Endpoint**: `PUT /records/:id`

**Headers**:
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Request Body** (Form Data):
```
title: "수정된 제목"
content: "수정된 내용..."
recordDate: "2025-12-29"
category: "일기"
tags: ["수정", "업데이트"]  (JSON string)
isFavorite: true
files: [새파일1, 새파일2, ...]  (선택사항)
deleteAttachmentIds: [1, 2]  (삭제할 첨부파일 ID 배열, 선택사항)
```

**JSON 형식 요청 (첨부파일 변경 없는 경우)**:
```
Content-Type: application/json

{
  "title": "수정된 제목",
  "content": "수정된 내용...",
  "recordDate": "2025-12-29",
  "category": "일기",
  "tags": ["수정", "업데이트"],
  "isFavorite": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 3,
    "title": "수정된 제목",
    "content": "수정된 내용...",
    "recordDate": "2025-12-29",
    "category": "일기",
    "tags": ["수정", "업데이트"],
    "isFavorite": true,
    "attachments": [
      {
        "id": 3,
        "fileName": "new_image.jpg",
        "fileSize": 256000,
        "mimeType": "image/jpeg",
        "url": "https://cdn.example.com/files/new_image.jpg"
      }
    ],
    "createdAt": "2025-12-29T15:00:00Z",
    "updatedAt": "2025-12-29T16:00:00Z"
  },
  "message": "기록이 수정되었습니다."
}
```

---

### 2.5 기록 삭제
기록을 삭제합니다.

**Endpoint**: `DELETE /records/:id`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "기록이 삭제되었습니다."
}
```

---

### 2.6 즐겨찾기 토글
기록의 즐겨찾기 상태를 변경합니다.

**Endpoint**: `PATCH /records/:id/favorite`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 3,
    "isFavorite": true
  },
  "message": "즐겨찾기가 설정되었습니다."
}
```

---

### 2.7 기록 일괄 삭제
여러 기록을 한 번에 삭제합니다.

**Endpoint**: `DELETE /records/bulk`

**Headers**:
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "ids": [1, 2, 3, 4, 5]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "deletedCount": 5
  },
  "message": "5개의 기록이 삭제되었습니다."
}
```

---

## 3. 카테고리 API

### 3.1 카테고리 목록 조회
사용자의 모든 카테고리를 조회합니다.

**Endpoint**: `GET /categories`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "일기",
      "color": "#FF6B6B",
      "icon": "📔",
      "displayOrder": 1,
      "recordCount": 15
    },
    {
      "id": 2,
      "name": "메모",
      "color": "#4ECDC4",
      "icon": "📝",
      "displayOrder": 2,
      "recordCount": 8
    },
    {
      "id": 3,
      "name": "학습",
      "color": "#45B7D1",
      "icon": "📚",
      "displayOrder": 3,
      "recordCount": 23
    }
  ]
}
```

---

### 3.2 카테고리 생성
새로운 카테고리를 생성합니다.

**Endpoint**: `POST /categories`

**Headers**:
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "운동",
  "color": "#95E1D3",
  "icon": "💪",
  "displayOrder": 6
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 6,
    "name": "운동",
    "color": "#95E1D3",
    "icon": "💪",
    "displayOrder": 6
  },
  "message": "카테고리가 생성되었습니다."
}
```

---

### 3.3 카테고리 수정
카테고리 정보를 수정합니다.

**Endpoint**: `PUT /categories/:id`

**Headers**:
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "운동 일지",
  "color": "#95E1D3",
  "icon": "🏃",
  "displayOrder": 6
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 6,
    "name": "운동 일지",
    "color": "#95E1D3",
    "icon": "🏃",
    "displayOrder": 6
  },
  "message": "카테고리가 수정되었습니다."
}
```

---

### 3.4 카테고리 삭제
카테고리를 삭제합니다.

**Endpoint**: `DELETE /categories/:id`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "카테고리가 삭제되었습니다."
}
```

---

## 4. 태그 API

### 4.1 태그 목록 조회
사용자가 사용한 모든 태그를 조회합니다.

**Endpoint**: `GET /tags`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| sort | string | X | 정렬 (name, count) |
| limit | integer | X | 개수 제한 |

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "tag": "개발",
      "count": 45
    },
    {
      "tag": "학습",
      "count": 32
    },
    {
      "tag": "프로젝트",
      "count": 28
    },
    {
      "tag": "아이디어",
      "count": 15
    }
  ]
}
```

---

### 4.2 인기 태그 조회
가장 많이 사용된 태그를 조회합니다.

**Endpoint**: `GET /tags/popular`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| limit | integer | X | 개수 (기본값: 10) |

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    { "tag": "개발", "count": 45 },
    { "tag": "학습", "count": 32 },
    { "tag": "프로젝트", "count": 28 }
  ]
}
```

---

## 5. 통계 API

### 5.1 전체 통계 조회
사용자의 전체 통계를 조회합니다.

**Endpoint**: `GET /statistics/summary`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalRecords": 156,
    "favoriteCount": 23,
    "categoryCount": 5,
    "firstRecordDate": "2025-01-01",
    "lastRecordDate": "2025-12-29",
    "recentCount": 12
  }
}
```

---

### 5.2 월별 통계 조회
월별 기록 통계를 조회합니다.

**Endpoint**: `GET /statistics/monthly`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| year | integer | X | 연도 (기본값: 현재 연도) |

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "month": "2025-01",
      "recordCount": 15,
      "favoriteCount": 3
    },
    {
      "month": "2025-02",
      "recordCount": 12,
      "favoriteCount": 2
    },
    {
      "month": "2025-12",
      "recordCount": 18,
      "favoriteCount": 5
    }
  ]
}
```

---

### 5.3 카테고리별 통계 조회
카테고리별 기록 통계를 조회합니다.

**Endpoint**: `GET /statistics/categories`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "category": "학습",
      "recordCount": 45,
      "favoriteCount": 12,
      "lastRecordDate": "2025-12-29"
    },
    {
      "category": "일기",
      "recordCount": 38,
      "favoriteCount": 8,
      "lastRecordDate": "2025-12-28"
    },
    {
      "category": "메모",
      "recordCount": 25,
      "favoriteCount": 3,
      "lastRecordDate": "2025-12-27"
    }
  ]
}
```

---

### 5.4 대시보드 데이터 조회
대시보드에 필요한 모든 데이터를 한 번에 조회합니다.

**Endpoint**: `GET /statistics/dashboard`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRecords": 156,
      "favoriteCount": 23,
      "categoryCount": 5,
      "recentCount": 12
    },
    "recentRecords": [
      {
        "id": 156,
        "title": "최근 기록",
        "recordDate": "2025-12-29",
        "category": "학습"
      }
    ],
    "monthlyActivity": [
      { "month": "2025-12", "count": 18 }
    ],
    "categoryDistribution": [
      { "category": "학습", "count": 45 },
      { "category": "일기", "count": 38 }
    ],
    "popularTags": [
      { "tag": "개발", "count": 45 }
    ]
  }
}
```

---

## 6. 첨부파일 API

### 6.1 첨부파일 목록 조회
기록의 모든 첨부파일을 조회합니다. (히스토리 페이지에서 호출)

**Endpoint**: `GET /records/:id/attachments`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "fileName": "screenshot.png",
      "fileSize": 1024000,
      "mimeType": "image/png",
      "url": "https://cdn.example.com/files/screenshot.png",
      "createdAt": "2025-12-29T15:00:00Z"
    }
  ]
}
```

**참고**: 
- 첨부파일 업로드는 기록 생성/수정 시 함께 처리됩니다.
- 메인 페이지 기록실에서 파일을 첨부하면 `POST /records` 또는 `PUT /records/:id`로 전송됩니다.
- 히스토리 페이지에서는 조회만 가능합니다.

---

## 7. 에러 코드

### HTTP 상태 코드

| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 |
| 401 | 인증 실패 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 409 | 충돌 (중복 등) |
| 422 | 유효성 검증 실패 |
| 500 | 서버 오류 |

### 에러 응답 형식

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값이 유효하지 않습니다.",
    "details": [
      {
        "field": "title",
        "message": "제목은 필수입니다."
      },
      {
        "field": "content",
        "message": "내용은 10자 이상이어야 합니다."
      }
    ]
  }
}
```

### 에러 코드 목록

| 코드 | 설명 |
|------|------|
| VALIDATION_ERROR | 유효성 검증 실패 |
| UNAUTHORIZED | 인증 실패 |
| FORBIDDEN | 권한 없음 |
| NOT_FOUND | 리소스 없음 |
| DUPLICATE_ENTRY | 중복 데이터 |
| INVALID_TOKEN | 유효하지 않은 토큰 |
| TOKEN_EXPIRED | 토큰 만료 |
| SERVER_ERROR | 서버 오류 |
| DATABASE_ERROR | 데이터베이스 오류 |
| FILE_TOO_LARGE | 파일 크기 초과 |
| INVALID_FILE_TYPE | 지원하지 않는 파일 형식 |

---

## 8. 공통 사항

### 인증 헤더
모든 인증이 필요한 API는 다음 헤더를 포함해야 합니다:
```
Authorization: Bearer {accessToken}
```

### 페이지네이션
목록 조회 API는 다음 형식의 페이지네이션을 지원합니다:
```json
{
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalRecords": 200,
    "limit": 20,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 날짜 형식
- 날짜: `YYYY-MM-DD` (예: 2025-12-29)
- 날짜/시간: ISO 8601 형식 (예: 2025-12-29T15:00:00Z)

### Rate Limiting
- 인증된 사용자: 1000 requests/hour
- 비인증 사용자: 100 requests/hour

초과 시 `429 Too Many Requests` 응답

---

## 9. 예제 시나리오

### 시나리오 1: 메인 페이지에서 기록 작성 (첨부파일 포함)

```bash
# 1. 로그인
POST /auth/login
{
  "email": "test@example.com",
  "password": "password123"
}

# 2. 메인 페이지 기록실에서 기록 작성 (파일 첨부)
POST /records
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- title: "오늘의 학습"
- content: "React Hooks를 공부했다..."
- recordDate: "2025-12-29"
- category: "학습"
- tags: ["React", "Hooks"]
- files: [image1.jpg, document.pdf]

# 3. 히스토리 페이지에서 기록 조회
GET /records?category=학습&sort=date_desc
Authorization: Bearer {token}

# 4. 히스토리 페이지에서 특정 기록 상세 조회 (첨부파일 포함)
GET /records/3
Authorization: Bearer {token}
```

### 시나리오 2: 기록 수정 (첨부파일 추가/삭제)

```bash
# 1. 메인 페이지에서 기록 수정
PUT /records/3
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- title: "수정된 제목"
- content: "수정된 내용..."
- recordDate: "2025-12-29"
- category: "학습"
- tags: ["React", "Hooks", "수정"]
- files: [new_image.jpg]  (새로 추가할 파일)
- deleteAttachmentIds: [1, 2]  (삭제할 기존 파일 ID)

# 2. 히스토리 페이지에서 수정된 기록 확인
GET /records/3
Authorization: Bearer {token}
```

### 시나리오 3: 통계 대시보드 구성

```bash
# 1. 대시보드 데이터 조회
GET /statistics/dashboard
Authorization: Bearer {token}

# 2. 월별 통계 조회
GET /statistics/monthly?year=2025
Authorization: Bearer {token}

# 3. 카테고리별 통계 조회
GET /statistics/categories
Authorization: Bearer {token}
```

### 시나리오 4: 히스토리 페이지에서 검색 및 필터링

```bash
# 1. 키워드로 검색
GET /records?search=React&sort=date_desc
Authorization: Bearer {token}

# 2. 카테고리 필터링
GET /records?category=학습&page=1&limit=20
Authorization: Bearer {token}

# 3. 태그 필터링
GET /records?tag=개발&favorite=true
Authorization: Bearer {token}

# 4. 날짜 범위 검색
GET /records?startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer {token}
```

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 2.0.0 | 2025-12-29 | 범용 기록 시스템으로 전면 개편 |
| 1.0.0 | 2025-12-01 | 초기 버전 (한국 역사 전용) |
