@echo off
setlocal enabledelayedexpansion

title Tool Clock - Git Push

echo ===================================================
echo           TOOL CLOCK - GITHUB PUSH SCRIPT
echo ===================================================
echo Target Remote: https://github.com/HoangKyAnh05/Tool_clock.git
echo.

:: Locate Git executable
set "GIT_CMD=git"
where git >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\Git\cmd\git.exe" (
        set "GIT_CMD=C:\Program Files\Git\cmd\git.exe"
    ) else if exist "C:\Program Files (x86)\Git\cmd\git.exe" (
        set "GIT_CMD=C:\Program Files (x86)\Git\cmd\git.exe"
    ) else if exist "%LocalAppData%\Programs\Git\cmd\git.exe" (
        set "GIT_CMD=%LocalAppData%\Programs\Git\cmd\git.exe"
    ) else (
        echo [ERROR] Git is not found! Please install Git from https://git-scm.com/
        pause
        exit /b 1
    )
)

echo [INFO] Git executable found.
echo.

:: Initialize Git if needed
if not exist ".git" (
    echo [INFO] Initializing Git repository...
    "!GIT_CMD!" init
    "!GIT_CMD!" branch -M main
)

:: Set remote origin
"!GIT_CMD!" remote get-url origin >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Adding remote origin...
    "!GIT_CMD!" remote add origin https://github.com/HoangKyAnh05/Tool_clock.git
) else (
    echo [INFO] Updating remote origin URL...
    "!GIT_CMD!" remote set-url origin https://github.com/HoangKyAnh05/Tool_clock.git
)

"!GIT_CMD!" branch -M main

echo.
set "msg="
set /p "msg=Nhap commit message (Enter de dung mac dinh 'Update Tool Clock codebase'): "
if "!msg!"=="" set "msg=Update Tool Clock codebase"

echo.
echo [1/3] Adding files to git...
"!GIT_CMD!" add .

echo.
echo [2/3] Committing changes...
"!GIT_CMD!" commit -m "!msg!"

echo.
echo [3/3] Pushing to GitHub (origin/main)...
"!GIT_CMD!" push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo [SUCCESS] Push len GitHub thanh cong!
    echo Remote: https://github.com/HoangKyAnh05/Tool_clock.git
    echo ===================================================
) else (
    echo.
    echo ===================================================
    echo [ERROR] Push khong thanh cong. Kiem tra lai ket noi hoac quyen truyen cap.
    echo ===================================================
)

echo.
pause
