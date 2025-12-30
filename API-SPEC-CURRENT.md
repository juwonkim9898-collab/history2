# 한국 역사 그리모어 - 현재 API 명세서

## 개요
이 문서는 현재 구현된 프론트엔드 API의 실제 동작을 명세합니다.
현재 시스템은 **백엔드 서버 없이** LocalStorage와 로컬 데이터를 사용하여 동작합니다.

**버전**: 1.0.0  
**최종 수정일**: 2025-12-29  
**상태**: 현재 구현됨

---

## 아키텍처

### 데이터 저장소
- **LocalStorage**: 사용자가 추가한 역사 이벤트 저장
- **로컬 데이터**: `data/koreanHistory.ts`에 하드코딩된 한국 역사 데이터

### 주요 서비스
1. **geminiService**: 로컬 데이터 검색 (API 호출 시뮬레이션)
2. **historyDB**: LocalStorage 기반 데이터베이스 작업
3. **koreanHistory**: 정적 한국 역사 데이터 및 검색 로직

---

## 1. 역사 검색 API

### `fetchHistoryStory(topic: string)`

로컬 한국 역사 데이터에서 검색어와 관련된 역사 이벤트를 검색합니다.

**파일**: `services/geminiService.ts`

#### Request
```typescript
topic: string  // 검색 키워드 (예: "조선", "한국전쟁", "독립운동")
```

#### Response
```typescript
Promise<HistoryEvent[]>

interface HistoryEvent {
  title: string;        // 이벤트 제목
  year: string;         // 연도 (예: "1392년", "기원전 37년")
  description: string;  // 간단한 설명
  details: string;      // 상세 내용
  tag?: string;         // 검색 태그 (선택)
  searchedAt?: number;  // 검색 시간 타임스탬프 (선택)
}
```

#### 동작 방식
1. 800-2000ms 랜덤 지연 (API 호출 시뮬레이션)
2. `searchHistoryEvents(topic)` 호출하여 로컬 데이터 검색
3. 결과가 없으면 에러 throw
4. 최대 5개의 결과 반환

#### Error Response
```typescript
Error {
  message: string  // 에러 메시지
}
```

**에러 케이스**:
- 빈 검색어: `"검색어를 입력해주세요."`
- 결과 없음: `"[검색어]에 대한 검색 결과가 없습니다. 다른 키워드를 시도해보세요."`
- 기타 오류: `"기록을 찾는 중 오류가 발생했습니다: [에러 메시지]"`

#### 예시
```typescript
// 성공
const events = await fetchHistoryStory("조선");
// 반환: [{ title: "조선 건국", year: "1392년", ... }, ...]

// 실패
await fetchHistoryStory("");
// throw Error("검색어를 입력해주세요.")
```

---

## 2. LocalStorage 데이터베이스 API

### `historyDB.getAll()`

LocalStorage에 저장된 모든 역사 이벤트를 가져옵니다.

**파일**: `services/db.ts`

#### Request
없음

#### Response
```typescript
Promise<HistoryEvent[]>
```

#### 동작 방식
1. LocalStorage에서 `grimoire_history` 키로 데이터 조회
2. 데이터 검증 (필수 필드 확인)
3. 연도 기준 정렬 (기원전 처리 포함)
4. 정렬된 배열 반환

#### 예시
```typescript
const allEvents = await historyDB.getAll();
// 반환: [{ title: "고구려 건국", year: "기원전 37년", ... }, ...]
```

---

### `historyDB.add(events: HistoryEvent[], searchTag?: string)`

새로운 역사 이벤트를 LocalStorage에 추가합니다.

#### Request
```typescript
events: HistoryEvent[]  // 추가할 이벤트 배열
searchTag?: string      // 검색 태그 (선택)
```

#### Response
```typescript
Promise<void>
```

#### 동작 방식
1. 이벤트 배열 검증 (필수 필드 확인)
2. 각 이벤트에 `tag`와 `searchedAt` 추가
3. 기존 데이터와 병합
4. 중복 제거 (제목 + 연도 기준)
5. LocalStorage에 저장

#### Error Response
```typescript
Error {
  message: "저장할 데이터가 유효하지 않습니다." |
           "필수 필드가 누락된 데이터가 있습니다." |
           "기록을 저장하는 중 오류가 발생했습니다."
}
```

#### 예시
```typescript
await historyDB.add(events, "조선왕조");
// LocalStorage에 저장됨
```

---

### `historyDB.clear()`

LocalStorage의 모든 역사 이벤트를 삭제합니다.

#### Request
없음

#### Response
```typescript
Promise<void>
```

#### Error Response
```typescript
Error {
  message: "기록을 삭제하는 중 오류가 발생했습니다."
}
```

---

### `historyDB.search(query: string)`

LocalStorage에 저장된 이벤트를 검색합니다.

#### Request
```typescript
query: string  // 검색어
```

#### Response
```typescript
Promise<HistoryEvent[]>
```

#### 동작 방식
1. 모든 이벤트 조회
2. 검색어가 비어있으면 전체 반환
3. title, description, details, year에서 검색어 포함 여부 확인
4. 매칭된 이벤트 반환

---

### `historyDB.getStats()`

저장된 이벤트의 통계를 반환합니다.

#### Request
없음

#### Response
```typescript
Promise<{
  totalEvents: number;
  periods: Record<string, number>;
}>
```

#### 시대 구분
- 기원전: year < 0
- 삼국시대: 0 ≤ year < 668
- 통일신라: 668 ≤ year < 918
- 고려시대: 918 ≤ year < 1392
- 조선시대: 1392 ≤ year < 1897
- 근현대: 1897 ≤ year < 1945
- 현대: year ≥ 1945

#### 예시
```typescript
const stats = await historyDB.getStats();
// 반환: { totalEvents: 15, periods: { "조선시대": 5, "고려시대": 3, ... } }
```

---

### `historyDB.getAllTags()`

저장된 모든 태그를 반환합니다.

#### Request
없음

#### Response
```typescript
Promise<string[]>  // 정렬된 태그 배열
```

---

### `historyDB.filterByTag(tag: string)`

특정 태그로 이벤트를 필터링합니다.

#### Request
```typescript
tag: string  // 필터링할 태그
```

#### Response
```typescript
Promise<HistoryEvent[]>
```

---

### `historyDB.hasTag(tag: string)`

특정 태그가 존재하는지 확인합니다.

#### Request
```typescript
tag: string  // 확인할 태그
```

#### Response
```typescript
Promise<boolean>
```

---

## 3. 로컬 데이터 검색 API

### `searchHistoryEvents(query: string)`

로컬 한국 역사 데이터에서 검색어와 관련된 이벤트를 찾습니다.

**파일**: `data/koreanHistory.ts`

#### Request
```typescript
query: string  // 검색 키워드
```

#### Response
```typescript
HistoryEvent[]  // 최대 5개
```

#### 검색 알고리즘
1. **정확한 카테고리명 매칭** (최우선)
   - 카테고리명과 검색어가 정확히 일치하거나 포함 관계
   
2. **키워드 매핑** (정확한 매칭만)
   - `SEARCH_KEYWORDS` 객체에서 정확히 일치하는 키워드 찾기
   - 매핑된 카테고리의 모든 이벤트 반환
   
3. **제목/설명 검색** (카테고리 매칭 실패 시)
   - title, description, year에서 검색어 포함 여부 확인
   - details는 제외 (너무 광범위한 매칭 방지)

#### 지원 카테고리
- `조선왕조`: 조선 건국, 한글 창제, 임진왜란, 정유재란, 인조반정
- `고구려`: 고구려 건국, 광개토대왕, 장수왕, 연개소문, 고구려 멸망
- `한국전쟁`: 한국전쟁 발발, 인천상륙작전, 중국군 개입, 1.4 후퇴, 휴전협정
- `독립운동`: 3.1 운동, 임시정부, 윤봉길 의거, 광복군, 광복
- `통일신라`: 삼국통일, 불국사/석굴암, 장보고, 골품제, 후삼국
- `고려`: 고려 건국, 몽골 침입, 팔만대장경, 금속활자, 공민왕

#### 키워드 매핑 예시
```typescript
'조선' → ['조선왕조']
'한글' → ['조선왕조']
'일본' → ['조선왕조', '독립운동']
'6.25' → ['한국전쟁']
'독립' → ['독립운동']
'신라' → ['통일신라']
```

---

### `getRandomHistoryEvents(count: number)`

랜덤한 역사 이벤트를 반환합니다.

#### Request
```typescript
count: number = 5  // 반환할 이벤트 개수 (기본값: 5)
```

#### Response
```typescript
HistoryEvent[]
```

---

## 4. 데이터 모델

### HistoryEvent
```typescript
interface HistoryEvent {
  title: string;        // 이벤트 제목 (필수)
  year: string;         // 연도 (필수, 예: "1392년", "기원전 37년")
  description: string;  // 간단한 설명 (필수)
  details: string;      // 상세 내용 (필수)
  tag?: string;         // 검색 태그 (선택)
  searchedAt?: number;  // 검색 시간 타임스탬프 (선택)
}
```

### LocalStorage 스키마
```typescript
// Key: "grimoire_history"
// Value: JSON.stringify(HistoryEvent[])
```

---

## 5. UI 텍스트 상수

**파일**: `types.ts`

```typescript
export const KOREAN_UI_TEXTS = {
  searchPlaceholder: "새로운 역사를 기록해보세요...",
  loading: "기록 중...",
  reset: "초기화",
  index: "목차",
  page: "페이지",
  end: "끝",
  errorTitle: "기록을 불러올 수 없습니다",
  errorMessage: "역사를 불러오는 중 오류가 발생했습니다.",
  confirmReset: "정말로 모든 기록을 삭제하시겠습니까?",
  suggestedTopics: ['조선왕조', '고구려', '한국전쟁', '독립운동'],
  bookTitle: "역사서",
  bookSubtitle: "시대의 기록",
  allTags: "전체",
  duplicateWarning: "이미 검색한 키워드입니다"
};
```

---

## 6. 에러 처리

### 공통 에러 형식
```typescript
Error {
  message: string  // 한국어 에러 메시지
}
```

### 에러 종류
1. **검색 에러**
   - 빈 검색어
   - 결과 없음
   - 검색 실패

2. **저장 에러**
   - 유효하지 않은 데이터
   - 필수 필드 누락
   - LocalStorage 저장 실패

3. **삭제 에러**
   - LocalStorage 삭제 실패

---

## 7. 성능 특성

### 응답 시간
- **검색 API**: 800-2000ms (시뮬레이션 지연)
- **LocalStorage 작업**: < 10ms (동기 작업)

### 데이터 제한
- **검색 결과**: 최대 5개
- **LocalStorage**: 브라우저 제한 (일반적으로 5-10MB)

---

## 8. 브라우저 호환성

### 필수 기능
- LocalStorage API
- ES6+ JavaScript
- React 18+

### 지원 브라우저
- Chrome/Edge (최신)
- Firefox (최신)
- Safari (최신)

---

## 부록: 전체 데이터 구조

### 카테고리별 이벤트 개수
- 조선왕조: 5개
- 고구려: 5개
- 한국전쟁: 5개
- 독립운동: 5개
- 통일신라: 5개
- 고려: 5개

**총 30개의 역사 이벤트**

### 연도 범위
- 최초: 기원전 37년 (고구려 건국)
- 최근: 1953년 (휴전협정 체결)
