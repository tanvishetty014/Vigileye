@echo off
title VIGIL Security Platform Startup
color 0A

echo.
echo ========================================
echo    VIGIL Security Platform Startup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

echo [INFO] Node.js detected
echo.

REM Kill any existing servers on ports 3000 and 5001
echo [INFO] Stopping any existing servers...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
    if not "%%a"=="0" (
        taskkill /PID %%a /F >nul 2>&1
    )
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5001"') do (
    if not "%%a"=="0" (
        taskkill /PID %%a /F >nul 2>&1
    )
)

echo.
echo [INFO] Starting Backend Server on port 5001...
cd /d "D:\vigil\backend"
start /min "VIGIL Backend" cmd /c "node server.js"

REM Wait for backend to start
timeout /t 5 /nobreak >nul

echo [INFO] Starting Frontend Server on port 3000...
cd /d "D:\vigil\frontend1"
start /min "VIGIL Frontend" cmd /c "npm run dev"

echo.
echo ========================================
echo    VIGIL is starting up!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5001
echo.
echo Press any key to close this window...
echo (The servers will continue running in the background)
echo.
pause >nul