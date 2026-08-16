@echo off
cd /d "%~dp0"
start "" wscript.exe "%~dp0create_shortcut.vbs"
exit /b 0
