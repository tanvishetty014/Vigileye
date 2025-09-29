@echo off
echo ========================================
echo    VIGIL - Cybersecurity Platform
echo    Starting Development Environment
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

:: Check if MongoDB is installed and running
echo Checking MongoDB connection...
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: MongoDB not found in PATH
    echo Please ensure MongoDB is installed and running
    echo Download from: https://www.mongodb.com/try/download/community
    echo.
)

:: Install backend dependencies if needed
echo Installing backend dependencies...
cd backend
if not exist node_modules (
    echo Installing npm packages for backend...
    npm install
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
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
)

:: Create .env file for backend if it doesn't exist
cd ..\backend
if not exist .env (
    echo Creating .env file from template...
    copy env.example .env
    echo.
    echo IMPORTANT: Please edit backend\.env file with your configuration:
    echo - Set your MongoDB connection string
    echo - Set your JWT secret key
    echo - Set your OpenAI API key for AI features
    echo.
    echo Opening .env file for editing...
    notepad .env
    echo.
    echo Please save the .env file and press any key to continue...
    pause >nul
)

echo.
echo ========================================
echo    Starting Services...
echo ========================================
echo.

:: Start MongoDB (if available)
echo Starting MongoDB...
start "MongoDB" cmd /k "mongod --dbpath ./data/db 2>nul || echo MongoDB already running or not installed"

:: Wait a moment for MongoDB to start
timeout /t 3 /nobreak >nul

:: Check and clear port conflicts
echo Checking for port conflicts...

:: Kill any existing Node.js processes
echo Stopping existing Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM nodemon.exe >nul 2>&1

:: Wait for processes to terminate
timeout /t 3 /nobreak >nul

:: Check specific ports and kill processes using them
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000" 2^>nul') do (
    if not "%%a"=="" (
        echo Killing process %%a using port 5000...
        taskkill /F /PID %%a >nul 2>&1
    )
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" 2^>nul') do (
    if not "%%a"=="" (
        echo Killing process %%a using port 3000...
        taskkill /F /PID %%a >nul 2>&1
    )
)

:: Wait for ports to be released
timeout /t 2 /nobreak >nul

:: Start Backend Server
echo Starting Backend Server (Port 5000)...
start "Vigil Backend" cmd /k "cd backend && npm run dev"

:: Wait a moment for backend to start
timeout /t 5 /nobreak >nul

:: Start Frontend Server
echo Starting Frontend Server (Port 3000)...
start "Vigil Frontend" cmd /k "cd frontend1 && npm run dev"

echo.
echo ========================================
echo    Services Started Successfully!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo API Health: http://localhost:5000/api/health
echo.
echo Press any key to open the application in your browser...
pause >nul

:: Open browser
start http://localhost:3000

echo.
echo Development environment is running!
echo Close this window to stop all services.
echo.
pause
