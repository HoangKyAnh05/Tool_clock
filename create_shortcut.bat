@echo off
cd /d "%~dp0"
title Tao Shortcut Desktop - Tool Clock

echo Dang tao Shortcut 'Tool Clock' tren Desktop...
start "" wscript.exe "%~dp0create_shortcut.vbs"
exit /b 0
