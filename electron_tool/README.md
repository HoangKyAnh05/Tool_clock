# Electron Task Countdown Tool

This project provides a Windows desktop application built with Electron that lets you enter daily tasks and shows a countdown for each task.

- Countdown starts at 07:00 AM (0 % progress) and reaches 100 % at midnight.
- Multiple tasks can be added; each shows its own progress bar.
- Packaged as a hidden‑window `.exe` with a desktop shortcut and an icon.
- Uses a modern dark UI with glass‑morphism and smooth micro‑animations.

## Quick Start (for developers)
```bash
# Install dependencies
npm install
# Build the installer
npm run build
```

After building, run the generated installer (`dist/TaskCountdown Setup.exe`). The installer will create a desktop shortcut.
