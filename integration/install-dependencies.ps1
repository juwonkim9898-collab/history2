# react-pageflip 패키지 설치 스크립트

$targetProject = "C:\kiro\project\FProject-web"

Write-Host "=== react-pageflip 패키지 설치 ===" -ForegroundColor Green

cd $targetProject

# package-lock.json이 있으면 npm, bun.lockb가 있으면 bun 사용
if (Test-Path "bun.lockb") {
    Write-Host "bun을 사용하여 설치합니다..." -ForegroundColor Cyan
    bun add react-pageflip
} elseif (Test-Path "package-lock.json") {
    Write-Host "npm을 사용하여 설치합니다..." -ForegroundColor Cyan
    npm install react-pageflip
} else {
    Write-Host "npm을 사용하여 설치합니다..." -ForegroundColor Cyan
    npm install react-pageflip
}

Write-Host "✓ 설치 완료!" -ForegroundColor Green
