@echo off
REM HabTracker Development Server
REM Batch script untuk menjalankan Vite dev server dari Command Prompt

echo.
echo 🚀 Starting HabTracker Development Server...
echo.

cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo ❌ node_modules not found. Running npm install...
    call npm install
)

REM Run vite using npx (lebih reliable di Windows)
call npx vite

if %errorlevel% neq 0 (
    echo.
    echo ❌ Dev server encountered an error
    echo Exit Code: %errorlevel%
    pause
)
