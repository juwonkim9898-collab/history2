# 한국 역사 그리모어 - 데이터베이스 스키마

## 📊 테이블 구조

### 1. history_events (역사 이벤트 테이블)

사용자가 검색하고 추가한 역사 이벤트를 저장하는 메인 테이블

```sql
CREATE TABLE history_events (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,                    -- 사용자 ID (외래키)
    title VARCHAR(255) NOT NULL,                -- 이벤트 제목
    year VARCHAR(50) NOT NULL,                  -- 연도 (예: "1392년", "기원전 37년")
    description TEXT NOT NULL,                  -- 간단한 설명
    details TEXT NOT NULL,                      -- 상세 내용
    tag VARCHAR(100),                           -- 검색 키워드 태그
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 검색/추가 시간
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- 생성 시간
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_tag (tag),
    INDEX idx_searched_at (searched_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 2. users (사용자 테이블)

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_username (username)
);
```

### 3. search_history (검색 기록 테이블) - 선택사항

사용자의 검색 기록을 추적하는 테이블

```sql
CREATE TABLE search_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    search_keyword VARCHAR(255) NOT NULL,       -- 검색한 키워드
    results_count INT DEFAULT 0,                -- 검색 결과 개수
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_keyword (search_keyword),
    INDEX idx_searched_at (searched_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 📋 컬럼 설명

### history_events 테이블

| 컬럼명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| id | BIGINT | 기본키 | 1, 2, 3... |
| user_id | BIGINT | 사용자 ID | 1 |
| title | VARCHAR(255) | 이벤트 제목 | "조선 건국" |
| year | VARCHAR(50) | 연도 | "1392년", "기원전 37년" |
| description | TEXT | 간단한 설명 | "이성계가 고려를 멸망시키고..." |
| details | TEXT | 상세 내용 | "1392년 이성계(태조)가..." |
| tag | VARCHAR(100) | 검색 태그 | "조선왕조" |
| searched_at | TIMESTAMP | 검색 시간 | 2025-12-29 10:30:00 |
| created_at | TIMESTAMP | 생성 시간 | 2025-12-29 10:30:00 |
| updated_at | TIMESTAMP | 수정 시간 | 2025-12-29 10:30:00 |

---

## 🔧 PostgreSQL 버전

```sql
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
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_history_user_id ON history_events(user_id);
CREATE INDEX idx_history_tag ON history_events(tag);
CREATE INDEX idx_history_searched_at ON history_events(searched_at);

-- 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_history_events_updated_at 
    BEFORE UPDATE ON history_events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

---

## 🗄️ MongoDB 버전 (NoSQL)

```javascript
// history_events 컬렉션
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  title: "조선 건국",
  year: "1392년",
  description: "이성계가 고려를 멸망시키고 조선을 건국하다",
  details: "1392년 이성계(태조)가 위화도 회군 후...",
  tag: "조선왕조",
  searchedAt: ISODate("2025-12-29T10:30:00Z"),
  createdAt: ISODate("2025-12-29T10:30:00Z"),
  updatedAt: ISODate("2025-12-29T10:30:00Z")
}

// 인덱스 생성
db.history_events.createIndex({ userId: 1 })
db.history_events.createIndex({ tag: 1 })
db.history_events.createIndex({ searchedAt: -1 })
db.history_events.createIndex({ userId: 1, searchedAt: -1 })
```

---

## 📊 샘플 데이터

```sql
-- 사용자 추가
INSERT INTO users (username, email, password_hash) 
VALUES ('testuser', 'test@example.com', '$2b$10$...');

-- 역사 이벤트 추가
INSERT INTO history_events (user_id, title, year, description, details, tag) 
VALUES 
(1, '조선 건국', '1392년', 
 '이성계가 고려를 멸망시키고 조선을 건국하다',
 '1392년 이성계(태조)가 위화도 회군 후 정권을 장악하고 고려를 멸망시켜 조선을 건국했습니다.',
 '조선왕조'),
 
(1, '한글 창제', '1443년',
 '세종대왕이 훈민정음(한글)을 창제하다',
 '1443년 세종대왕이 백성들이 쉽게 배우고 사용할 수 있는 문자인 훈민정음을 창제했습니다.',
 '조선왕조');
```

---

## 🔍 주요 쿼리

### 1. 사용자의 모든 역사 이벤트 조회 (연도순)

```sql
SELECT * FROM history_events 
WHERE user_id = 1 
ORDER BY 
  CASE 
    WHEN year LIKE '기원전%' THEN -CAST(REGEXP_REPLACE(year, '[^0-9]', '') AS SIGNED)
    ELSE CAST(REGEXP_REPLACE(year, '[^0-9]', '') AS SIGNED)
  END ASC;
```

### 2. 태그별 필터링

```sql
SELECT * FROM history_events 
WHERE user_id = 1 AND tag = '조선왕조'
ORDER BY searched_at DESC;
```

### 3. 모든 태그 목록 조회

```sql
SELECT DISTINCT tag 
FROM history_events 
WHERE user_id = 1 AND tag IS NOT NULL
ORDER BY tag;
```

### 4. 검색어로 이벤트 찾기

```sql
SELECT * FROM history_events 
WHERE user_id = 1 
  AND (
    title LIKE '%조선%' 
    OR description LIKE '%조선%' 
    OR year LIKE '%조선%'
  )
ORDER BY searched_at DESC;
```

### 5. 시대별 통계

```sql
SELECT 
  CASE 
    WHEN year LIKE '기원전%' THEN '기원전'
    WHEN CAST(REGEXP_REPLACE(year, '[^0-9]', '') AS SIGNED) < 668 THEN '삼국시대'
    WHEN CAST(REGEXP_REPLACE(year, '[^0-9]', '') AS SIGNED) < 918 THEN '통일신라'
    WHEN CAST(REGEXP_REPLACE(year, '[^0-9]', '') AS SIGNED) < 1392 THEN '고려시대'
    WHEN CAST(REGEXP_REPLACE(year, '[^0-9]', '') AS SIGNED) < 1897 THEN '조선시대'
    WHEN CAST(REGEXP_REPLACE(year, '[^0-9]', '') AS SIGNED) < 1945 THEN '근현대'
    ELSE '현대'
  END AS period,
  COUNT(*) AS count
FROM history_events 
WHERE user_id = 1
GROUP BY period
ORDER BY 
  CASE period
    WHEN '기원전' THEN 1
    WHEN '삼국시대' THEN 2
    WHEN '통일신라' THEN 3
    WHEN '고려시대' THEN 4
    WHEN '조선시대' THEN 5
    WHEN '근현대' THEN 6
    WHEN '현대' THEN 7
  END;
```

### 6. 중복 체크 (제목 + 연도)

```sql
SELECT COUNT(*) 
FROM history_events 
WHERE user_id = 1 
  AND title = '조선 건국' 
  AND year = '1392년';
```

### 7. 태그 존재 여부 확인

```sql
SELECT EXISTS(
  SELECT 1 FROM history_events 
  WHERE user_id = 1 AND tag = '조선왕조'
) AS has_tag;
```

---

## 🔐 보안 고려사항

1. **SQL Injection 방지**: Prepared Statements 사용
2. **사용자 인증**: JWT 또는 세션 기반 인증
3. **권한 관리**: 사용자는 자신의 데이터만 접근 가능
4. **비밀번호**: bcrypt 해싱 사용

---

## 🚀 마이그레이션 전략

### LocalStorage → Database 마이그레이션

```javascript
// 1. LocalStorage에서 데이터 읽기
const localData = localStorage.getItem('grimoire_history');
const events = JSON.parse(localData);

// 2. API로 전송
for (const event of events) {
  await fetch('/api/history-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: event.title,
      year: event.year,
      description: event.description,
      details: event.details,
      tag: event.tag,
      searchedAt: event.searchedAt
    })
  });
}

// 3. LocalStorage 정리
localStorage.removeItem('grimoire_history');
```

---

## 📝 API 엔드포인트 예시

```
GET    /api/history-events          - 모든 이벤트 조회
POST   /api/history-events          - 이벤트 추가
GET    /api/history-events/:id      - 특정 이벤트 조회
PUT    /api/history-events/:id      - 이벤트 수정
DELETE /api/history-events/:id      - 이벤트 삭제
DELETE /api/history-events          - 모든 이벤트 삭제

GET    /api/history-events/tags     - 모든 태그 조회
GET    /api/history-events/stats    - 통계 조회
GET    /api/history-events/search?q=조선  - 검색
```

이 스키마를 사용하면 LocalStorage에서 실제 데이터베이스로 쉽게 전환할 수 있습니다!
