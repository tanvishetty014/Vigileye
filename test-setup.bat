@echo off
echo ========================================
echo    VIGIL - Testing Setup
echo ========================================
echo.

:: Check Node.js
echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
) else (
    echo ✅ Node.js found:
    node --version
)

echo.

:: Check MongoDB
echo Checking MongoDB installation...
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  MongoDB not found in PATH
    echo Please install MongoDB from https://www.mongodb.com/try/download/community
) else (
    echo ✅ MongoDB found:
    mongod --version
)

echo.

:: Check backend dependencies
echo Checking backend dependencies...
cd backend
if exist node_modules (
    echo ✅ Backend dependencies installed
) else (
    echo ❌ Backend dependencies not installed
    echo Run: install-dependencies.bat
    pause
    exit /b 1
)

:: Check frontend dependencies
cd ..\frontend1
if exist node_modules (
    echo ✅ Frontend dependencies installed
) else (
    echo ❌ Frontend dependencies not installed
    echo Run: install-dependencies.bat
    pause
    exit /b 1
)

cd ..

echo.

:: Check environment file
echo Checking backend configuration...
if exist backend\.env (
    echo ✅ Backend .env file exists
) else (
    echo ⚠️  Backend .env file not found
    echo Please create .env file from env.example
)

echo.

:: Test backend server startup
echo Testing backend server startup...
cd backend
timeout /t 2 /nobreak >nul
start /B node server.js >nul 2>&1
timeout /t 3 /nobreak >nul

:: Test API health endpoint
curl -s http://localhost:5000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend server is responding
) else (
    echo ❌ Backend server not responding
    echo Check if port 5000 is available
)

:: Kill the test server
taskkill /F /IM node.exe >nul 2>&1

cd ..

echo.
echo ========================================
echo    Setup Test Complete
echo ========================================
echo.
echo Next steps:
echo 1. Ensure MongoDB is running
echo 2. Edit backend\.env with your configuration
echo 3. Run start-dev.bat to start development environment
echo.
pause
