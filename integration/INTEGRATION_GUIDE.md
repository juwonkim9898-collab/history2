# 한국 역사 그리모어 통합 가이드

## 완료된 작업

✅ 그리모어 파일들이 `C:\kiro\project\FProject-web\src\grimoire\`에 복사되었습니다:
- `components/` (ErrorBoundary.tsx, Grimoire.tsx, Page.tsx)
- `services/` (db.ts, geminiService.ts)
- `data/` (koreanHistory.ts)
- `types.ts`
- `GrimoireApp.tsx`

## 수동으로 해야 할 작업

### 1. History.tsx 교체

`C:\kiro\project\FProject-web\src\pages\History.tsx` 파일을 삭제하고,
현재 프로젝트의 `integration/NewHistory.tsx` 파일 내용으로 교체하세요.

```bash
# PowerShell에서 실행
cd C:\kiro\project\FProject-web
copy C:\kiro\history2\integration\NewHistory.tsx src\pages\History.tsx
```

### 2. 필요한 패키지 설치

`C:\kiro\project\FProject-web` 폴더에서 다음 명령어를 실행하세요:

```bash
npm install react-pageflip
# 또는
bun add react-pageflip
```

### 3. tsconfig.json 경로 별칭 확인

`C:\kiro\project\FProject-web\tsconfig.json` 파일에서 경로 별칭이 설정되어 있는지 확인:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 4. 개발 서버 실행

```bash
cd C:\kiro\project\FProject-web
npm run dev
# 또는
bun run dev
```

### 5. 테스트

브라우저에서 `/history` 페이지로 이동하여 그리모어가 정상적으로 표시되는지 확인하세요.

## 통합된 기능

- ✅ 한국 역사 검색 (30개 이벤트)
- ✅ 검색 결과 사이드바
- ✅ 책 형태의 그리모어 UI
- ✅ 페이지 넘기기 애니메이션
- ✅ 태그 필터링
- ✅ LocalStorage 기반 데이터 저장
- ✅ 목차 기능
- ✅ 초기화 기능

## 제거된 기능

- ❌ 기존 History 페이지의 mock 데이터
- ❌ 기존 History 페이지의 챕터 시스템

## 문제 해결

### 1. 모듈을 찾을 수 없다는 에러
```
Cannot find module '@/grimoire/...'
```
→ tsconfig.json의 paths 설정을 확인하세요.

### 2. react-pageflip 에러
```
Module not found: Can't resolve 'react-pageflip'
```
→ `npm install react-pageflip` 또는 `bun add react-pageflip` 실행

### 3. MainLayout을 찾을 수 없다는 에러
→ 기존 프로젝트의 MainLayout 컴포넌트 경로를 확인하세요.

### 4. 스타일이 깨짐
→ Tailwind CSS가 제대로 설정되어 있는지 확인하세요.

## 추가 커스터마이징

### 배경색 변경
`NewHistory.tsx`의 최상위 div 클래스를 수정:
```tsx
<div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
```

### 책 크기 조정
`grimoire/components/Grimoire.tsx`의 `bookDimensions` 값을 수정

### 데이터 추가
`grimoire/data/koreanHistory.ts`의 `KOREAN_HISTORY_DATA`에 새로운 카테고리와 이벤트 추가

## 연락처

문제가 발생하면 현재 프로젝트 폴더에서 다시 질문해주세요!
