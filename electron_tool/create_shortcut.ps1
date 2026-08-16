# create_shortcut.ps1
# Creates a Desktop shortcut that launches the app silently (no terminal window)

Set-StrictMode -Version 'Latest'

$AppDir      = Split-Path -Parent $MyInvocation.MyCommand.Definition
$LauncherVbs = Join-Path $AppDir "launcher.vbs"
$Desktop     = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $Desktop "Task Countdown.lnk"

# Icon (icon.ico preferred)
$IconPath = Join-Path $AppDir "icon.ico"

# Build the shortcut pointing to wscript.exe + launcher.vbs
$WshShell = New-Object -ComObject WScript.Shell
$sc = $WshShell.CreateShortcut($ShortcutPath)
$sc.TargetPath       = "wscript.exe"
$sc.Arguments        = "`"$LauncherVbs`""
$sc.WorkingDirectory = $AppDir
$sc.WindowStyle      = 1          # 1 = Normal
$sc.Description      = "Task Countdown - Daily productivity tracker"
if (Test-Path $IconPath) {
    $sc.IconLocation = $IconPath
} else {
    $FallbackIcon = Join-Path $AppDir "node_modules\electron\dist\electron.exe"
    if (Test-Path $FallbackIcon) {
        $sc.IconLocation = $FallbackIcon
    }
}
$sc.Save()

Write-Host "Desktop shortcut created: $ShortcutPath"
Write-Host "Double-click 'Task Countdown' on your desktop to launch the app (no terminal)."
