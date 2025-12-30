# 배경 이미지 설정 가이드

## 📸 배경 이미지 추가 방법

### 1. 이미지 저장

제공된 도서관 이미지를 다음 위치에 저장하세요:

```
C:\kiro\project\FProject-web\public\library-background.jpg
```

### 2. History.tsx 업데이트

`C:\kiro\project\FProject-web\src\pages\History.tsx` 파일을 다시 교체하세요:

```powershell
copy C:\kiro\history2\integration\NewHistory.tsx C:\kiro\project\FProject-web\src\pages\History.tsx
```

### 3. 개발 서버 재시작

```powershell
cd C:\kiro\project\FProject-web
npm run dev
```

## 🎨 적용된 스타일

- **배경 이미지**: 도서관 책장 이미지
- **오버레이**: 검은색 40% 투명도 + 블러 효과
- **고정 배경**: 스크롤해도 배경 고정 (parallax 효과)
- **반응형**: 모든 화면 크기에 맞게 조정

## 🔧 커스터마이징

### 오버레이 투명도 조정

`NewHistory.tsx`에서 다음 부분 수정:

```tsx
<div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
```

- `bg-black/40` → `bg-black/30` (더 밝게)
- `bg-black/40` → `bg-black/60` (더 어둡게)

### 블러 효과 조정

- `backdrop-blur-sm` → `backdrop-blur-none` (블러 제거)
- `backdrop-blur-sm` → `backdrop-blur-md` (더 강한 블러)
- `backdrop-blur-sm` → `backdrop-blur-lg` (매우 강한 블러)

### 배경 고정 해제

```tsx
backgroundAttachment: 'fixed'  // 고정
backgroundAttachment: 'scroll' // 스크롤 따라 이동
```

## 📁 파일 구조

```
C:\kiro\project\FProject-web\
├── public/
│   └── library-background.jpg  ← 이미지 여기에 저장
└── src/
    └── pages/
        └── History.tsx         ← 업데이트된 파일
```

## 💡 다른 이미지 사용하기

다른 배경 이미지를 사용하려면:

1. 이미지를 `public/` 폴더에 저장 (예: `my-background.jpg`)
2. `NewHistory.tsx`에서 경로 변경:
   ```tsx
   backgroundImage: 'url("/my-background.jpg")'
   ```

## 🎯 결과

- 도서관 책장 배경
- 반투명 오버레이로 텍스트 가독성 확보
- 그리모어 책이 배경 위에 떠있는 효과
- 고급스러운 분위기
