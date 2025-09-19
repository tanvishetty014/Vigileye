@echo off
echo ========================================
echo    VIGIL - Cybersecurity Platform
echo    Starting Production Environment
echo ========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Install backend dependencies if needed
echo Installing backend dependencies...
cd backend
if not exist node_modules (
    echo Installing npm packages for backend...
    npm install --production
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
)

:: Install frontend dependencies if needed
cd ..\frontend1
if not exist node_modules (
    echo Installing npm packages for frontend...
    npm install --production
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
)

:: Build frontend
echo Building frontend for production...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build frontend
    pause
    exit /b 1
)

:: Check for .env file in backend
cd ..\backend
if not exist .env (
    echo ERROR: .env file not found in backend directory
    echo Please create .env file with production configuration
    echo You can copy env.example to .env and update the values
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Starting Production Services...
echo ========================================
echo.

:: Start MongoDB (if available)
echo Starting MongoDB...
start "MongoDB" cmd /k "mongod --dbpath ./data/db 2>nul || echo MongoDB already running or not installed"

:: Wait for MongoDB to start
timeout /t 3 /nobreak >nul

:: Start Backend Server
echo Starting Backend Server (Production Mode)...
start "Vigil Backend (Production)" cmd /k "cd backend && npm start"

:: Wait for backend to start
timeout /t 5 /nobreak >nul

:: Start Frontend Server
echo Starting Frontend Server (Production Mode)...
start "Vigil Frontend (Production)" cmd /k "cd frontend1 && npm start"

echo.
echo ========================================
echo    Production Services Started!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo API Health: http://localhost:5000/api/health
echo.
echo Production environment is running!
echo Close this window to stop all services.
echo.
pause
