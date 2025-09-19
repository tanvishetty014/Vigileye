@echo off
echo ========================================
echo    VIGIL - Port Conflict Resolution
echo ========================================
echo.

echo Checking for processes using ports 3000, 5000, and 5001...
echo.

:: Check port 3000
netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo Found processes using port 3000:
    netstat -ano | findstr :3000
    echo.
    echo Killing processes on port 3000...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    echo Port 3000 cleared.
) else (
    echo Port 3000 is available.
)

echo.

:: Check port 5000
netstat -ano | findstr :5000 >nul 2>&1
if %errorlevel% equ 0 (
    echo Found processes using port 5000:
    netstat -ano | findstr :5000
    echo.
    echo Killing processes on port 5000...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    echo Port 5000 cleared.
) else (
    echo Port 5000 is available.
)

echo.

:: Check port 5001
netstat -ano | findstr :5001 >nul 2>&1
if %errorlevel% equ 0 (
    echo Found processes using port 5001:
    netstat -ano | findstr :5001
    echo.
    echo Killing processes on port 5001...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5001') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    echo Port 5001 cleared.
) else (
    echo Port 5001 is available.
)

echo.
echo ========================================
echo    Ports Cleared Successfully!
echo ========================================
echo.
echo You can now run:
echo - start-dev.bat (for development)
echo - start-production.bat (for production)
echo.
pause
