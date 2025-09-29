@echo off
echo ========================================
echo    VIGIL - Dependency Installer
echo    Installing all required packages
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

echo ✅ Node.js version:
node --version
echo.

:: Clear any existing processes
echo Clearing existing Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM nodemon.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Install Backend Dependencies
echo Installing backend dependencies...
cd backend

:: Remove old node_modules if exists
if exist node_modules (
    echo Removing old backend node_modules...
    rmdir /s /q node_modules >nul 2>&1
)

:: Remove package-lock.json if exists
if exist package-lock.json (
    echo Removing old package-lock.json...
    del package-lock.json >nul 2>&1
)

:: Clear npm cache
npm cache clean --force >nul 2>&1

:: Install dependencies
echo Installing backend packages...
npm install

if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    echo Trying with npm install --force...
    npm install --force
    if %errorlevel% neq 0 (
        echo ERROR: Still failed to install backend dependencies
        pause
        exit /b 1
    )
)

echo ✅ Backend dependencies installed successfully
echo.

:: Install Frontend Dependencies
echo Installing frontend dependencies...
cd ../frontend1

:: Remove old node_modules if exists
if exist node_modules (
    echo Removing old frontend node_modules...
    rmdir /s /q node_modules >nul 2>&1
)

:: Remove package-lock.json if exists
if exist package-lock.json (
    echo Removing old package-lock.json...
    del package-lock.json >nul 2>&1
)

:: Clear npm cache
npm cache clean --force >nul 2>&1

:: Install dependencies
echo Installing frontend packages...
npm install

if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    echo Trying with npm install --force...
    npm install --force
    if %errorlevel% neq 0 (
        echo ERROR: Still failed to install frontend dependencies
        pause
        exit /b 1
    )
)

echo ✅ Frontend dependencies installed successfully
echo.

cd ..

:: Create .env file if it doesn't exist
if not exist backend\.env (
    echo Creating backend .env file...
    copy backend\env.example backend\.env
    echo.
    echo ⚠️  IMPORTANT: Please edit backend\.env with your configuration:
    echo    - Set your MongoDB connection string
    echo    - Set your JWT secret key  
    echo    - Set your OpenAI API key (optional)
    echo.
)

echo ========================================
echo    Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit backend\.env with your configuration
echo 2. Start MongoDB service
echo 3. Run start-dev.bat to start development servers
echo.
echo Quick start commands:
echo   npm run dev    (in backend folder)
echo   npm run dev    (in frontend1 folder)
echo.
pause