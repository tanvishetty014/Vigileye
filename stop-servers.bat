@echo off
title VIGIL Security Platform - Stop Servers
color 0C

echo.
echo ========================================
echo    VIGIL - Stop All Servers
echo ========================================
echo.

echo [INFO] Stopping servers on ports 3000 and 5001...

REM Stop processes on port 3000 (Frontend)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
    if not "%%a"=="0" (
        echo [INFO] Stopping process on port 3000 (PID: %%a)
        taskkill /PID %%a /F >nul 2>&1
    )
)

REM Stop processes on port 5001 (Backend)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5001"') do (
    if not "%%a"=="0" (
        echo [INFO] Stopping process on port 5001 (PID: %%a)
        taskkill /PID %%a /F >nul 2>&1
    )
)

REM Also kill any node processes that might be VIGIL related
echo [INFO] Cleaning up any remaining Node.js processes...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq VIGIL*" >nul 2>&1

echo.
echo ========================================
echo    All VIGIL servers stopped!
echo ========================================
echo.
pause