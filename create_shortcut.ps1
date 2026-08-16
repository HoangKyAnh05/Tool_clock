# PowerShell Script to create Desktop Shortcut for Tool Clock
$rootDir = $PSScriptRoot
$electronDir = Join-Path $rootDir "electron_tool"
$desktopPath = [System.IO.Path]::Combine([System.Environment]::GetFolderPath('Desktop'), "Tool Clock.lnk")

$launcherVbs = Join-Path $electronDir "launcher.vbs"
$targetExe = Join-Path $electronDir "node_modules\electron\dist\electron.exe"
$iconPath = Join-Path $electronDir "icon.ico"

if (-not (Test-Path $iconPath)) {
    $iconPath = $targetExe
}

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($desktopPath)

if (Test-Path $launcherVbs) {
    $Shortcut.TargetPath = "wscript.exe"
    $Shortcut.Arguments = "`"$launcherVbs`""
} else {
    $Shortcut.TargetPath = $targetExe
    $Shortcut.Arguments = "."
}

$Shortcut.WorkingDirectory = $electronDir
$Shortcut.WindowStyle = 1
$Shortcut.Description = "Tool Clock - Task Countdown Application"
if (Test-Path $iconPath) {
    $Shortcut.IconLocation = $iconPath
}

$Shortcut.Save()

Write-Host "Da tao Shortcut 'Tool Clock' tren Desktop thanh cong!" -ForegroundColor Green
