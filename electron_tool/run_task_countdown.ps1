#!/usr/bin/env pwsh

# ------------------------------------------------------------
# Launch Task Countdown Electron app (PowerShell version)
# ------------------------------------------------------------

Set-StrictMode -Version 'Latest'

# Directory where this script resides
$APP_DIR = Split-Path -Parent $MyInvocation.MyCommand.Definition

# ---------- Ensure npm dependencies ----------
Push-Location $APP_DIR
if (-Not (Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies ..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "npm install failed. Ensure Node.js is installed."
        Pop-Location
        exit 1
    }
} else {
    Write-Host "npm dependencies already installed."
}
Pop-Location

# ---------- Run packaged exe if present ----------
$exePath = Get-ChildItem -Path "$APP_DIR\dist" -Filter "*Setup*.exe" -File -ErrorAction SilentlyContinue | Select-Object -First 1
if ($exePath) {
    Write-Host "Launching packaged executable: $($exePath.FullName)"
    Start-Process -FilePath $exePath.FullName
    exit 0
}

# ---------- Development mode (npm start) hidden ----------
Write-Host "Running in development mode (npm start) ..."
Start-Process -FilePath "npm" -ArgumentList "run start" -WorkingDirectory $APP_DIR -WindowStyle Hidden

exit 0
