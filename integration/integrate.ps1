# 한국 역사 그리모어 통합 스크립트

$targetProject = "C:\kiro\project\FProject-web"
$currentProject = "C:\kiro\history2"

Write-Host "=== 한국 역사 그리모어 통합 시작 ===" -ForegroundColor Green

# 1. 대상 프로젝트 존재 확인
if (-not (Test-Path $targetProject)) {
    Write-Host "오류: 대상 프로젝트를 찾을 수 없습니다: $targetProject" -ForegroundColor Red
    exit 1
}

Write-Host "✓ 대상 프로젝트 확인됨" -ForegroundColor Green

# 2. grimoire 폴더가 이미 복사되었는지 확인
if (Test-Path "$targetProject\src\grimoire") {
    Write-Host "✓ grimoire 폴더가 이미 존재합니다" -ForegroundColor Yellow
} else {
    Write-Host "오류: grimoire 폴더가 없습니다. 먼저 파일을 복사해야 합니다." -ForegroundColor Red
    exit 1
}

# 3. 기존 History.tsx 백업
$historyPath = "$targetProject\src\pages\History.tsx"
if (Test-Path $historyPath) {
    $backupPath = "$targetProject\src\pages\History.tsx.backup"
    Copy-Item $historyPath $backupPath -Force
    Write-Host "✓ 기존 History.tsx 백업됨: History.tsx.backup" -ForegroundColor Green
}

# 4. 새로운 History.tsx 복사
$newHistoryPath = "$currentProject\integration\NewHistory.tsx"
if (Test-Path $newHistoryPath) {
    Copy-Item $newHistoryPath $historyPath -Force
    Write-Host "✓ 새로운 History.tsx 복사 완료" -ForegroundColor Green
} else {
    Write-Host "오류: NewHistory.tsx를 찾을 수 없습니다" -ForegroundColor Red
    exit 1
}

# 5. package.json 확인
$packageJsonPath = "$targetProject\package.json"
$packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json

if ($packageJson.dependencies -and $packageJson.dependencies."react-pageflip") {
    $hasReactPageflip = $true
} else {
    $hasReactPageflip = $false
}

if (-not $hasReactPageflip) {
    Write-Host "" -ForegroundColor Yellow
    Write-Host "⚠ react-pageflip 패키지가 설치되지 않았습니다" -ForegroundColor Yellow
    Write-Host "다음 명령어를 실행하세요:" -ForegroundColor Yellow
    Write-Host "  cd $targetProject" -ForegroundColor Cyan
    Write-Host "  npm install react-pageflip" -ForegroundColor Cyan
    Write-Host "  또는" -ForegroundColor Yellow
    Write-Host "  bun add react-pageflip" -ForegroundColor Cyan
} else {
    Write-Host "✓ react-pageflip 패키지가 이미 설치되어 있습니다" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== 통합 완료! ===" -ForegroundColor Green
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Cyan
Write-Host "1. cd $targetProject" -ForegroundColor White
Write-Host "2. npm run dev (또는 bun run dev)" -ForegroundColor White
Write-Host "3. 브라우저에서 /history 페이지 확인" -ForegroundColor White
Write-Host ""
Write-Host "문제가 발생하면 integration/INTEGRATION_GUIDE.md를 참고하세요" -ForegroundColor Yellow
