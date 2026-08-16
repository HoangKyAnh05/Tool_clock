@echo off
rem ------------------------------------------------------------
rem Install npm dependencies for Task Countdown Electron app
rem ------------------------------------------------------------

set "APP_DIR=%~dp0"

echo Installing dependencies in "%APP_DIR%" ...
pushd "%APP_DIR%"

rem Ensure npm is available
where npm >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not found in PATH. Install Node.js first.
    exit /b 1
)

npm install
if errorlevel 1 (
    echo ERROR: npm install failed.
    popd
    exit /b 1
)

echo All dependencies installed successfully.
popd

exit /b 0
