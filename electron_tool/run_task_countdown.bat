@echo off
rem ------------------------------------------------------------
rem Launch Task Countdown Electron app
rem ------------------------------------------------------------

rem Directory of this script
set "APP_DIR=%~dp0"

rem ---------- Ensure npm dependencies ----------
pushd "%APP_DIR%"
if not exist node_modules (
    echo Installing npm dependencies ...
    call npm install
    if errorlevel 1 (
        echo ERROR: npm install failed. Ensure Node.js is installed.
        popd
        exit /b 1
    )
) else (
    echo npm dependencies already installed.
)

rem ---------- Launch Electron app ----------
echo Starting Task Countdown app ...
start "Task Countdown" /B npx electron .

popd
exit /b 0
