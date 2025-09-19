@echo off
echo ========================================
echo    VIGIL - Installing Dependencies
echo ========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo Recommended version: Node.js 18.x or higher
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

:: Install backend dependencies
echo Installing Backend Dependencies...
cd backend
if exist node_modules (
    echo Backend dependencies already installed
) else (
    echo Installing npm packages for backend...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
    echo Backend dependencies installed successfully!
)
cd ..

echo.

:: Install frontend dependencies
echo Installing Frontend Dependencies...
cd frontend1
if exist node_modules (
    echo Frontend dependencies already installed
) else (
    echo Installing npm packages for frontend...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
    echo Frontend dependencies installed successfully!
)
cd ..

echo.
echo ========================================
echo    Dependencies Installation Complete!
echo ========================================
echo.

:: Check MongoDB installation
echo Checking MongoDB installation...
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: MongoDB not found in PATH
    echo.
    echo To complete the setup, please install MongoDB:
    echo 1. Download from: https://www.mongodb.com/try/download/community
    echo 2. Install MongoDB Community Server
    echo 3. Add MongoDB to your system PATH
    echo 4. Create a data directory: mkdir data\db
    echo.
) else (
    echo MongoDB is installed and available
)

echo.
echo Next steps:
echo 1. Run 'start-dev.bat' to start the development environment
echo 2. Or run 'start-production.bat' for production mode
echo.
echo For first-time setup:
echo 1. Edit backend\.env file with your configuration
echo 2. Set your MongoDB connection string
echo 3. Set your JWT secret key
echo 4. Set your OpenAI API key (optional, for AI features)
echo.
pause
