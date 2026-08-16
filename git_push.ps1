# PowerShell script to push code to GitHub repository
$remoteUrl = "https://github.com/HoangKyAnh05/Tool_clock.git"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "          TOOL CLOCK - GITHUB PUSH SCRIPT          " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Target Remote: $remoteUrl`n" -ForegroundColor Yellow

if (-not (Test-Path ".git")) {
    Write-Host "[INFO] Initializing git repository..." -ForegroundColor Green
    git init
    git branch -M main
}

$hasOrigin = git remote get-url origin 2>$null
if (-not $hasOrigin) {
    Write-Host "[INFO] Adding origin remote..." -ForegroundColor Green
    git remote add origin $remoteUrl
} else {
    Write-Host "[INFO] Setting origin remote URL..." -ForegroundColor Green
    git remote set-url origin $remoteUrl
}

git branch -M main

$commitMsg = Read-Host "Nhap commit message (De trong neu dung 'Update Tool Clock codebase')"
if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = "Update Tool Clock codebase"
}

Write-Host "`n[1/3] Adding files to git..." -ForegroundColor Green
git add .

Write-Host "[2/3] Committing changes..." -ForegroundColor Green
git commit -m "$commitMsg"

Write-Host "[3/3] Pushing to GitHub (main)..." -ForegroundColor Green
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n===================================================" -ForegroundColor Green
    Write-Host "[SUCCESS] Push len GitHub thanh cong!" -ForegroundColor Green
    Write-Host "Repository: $remoteUrl" -ForegroundColor Yellow
    Write-Host "===================================================" -ForegroundColor Green
} else {
    Write-Host "`n===================================================" -ForegroundColor Red
    Write-Host "[ERROR] Push ko thanh cong. Vui long kiem tra lai ket noi hoac xac thuc GitHub." -ForegroundColor Red
    Write-Host "===================================================" -ForegroundColor Red
}
