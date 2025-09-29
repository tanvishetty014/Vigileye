@echo off
echo ========================================
echo   VIGIL - Breach API Test
echo ========================================
echo.

echo Testing Python breach checker script...
cd backend\scripts
python breach-checker.py test@example.com
echo.

echo ========================================
echo NOTE: To test the full API integration:
echo 1. Start the backend server: npm run dev (in backend folder)
echo 2. Open browser to http://localhost:3000/breach-lookup
echo 3. Enter an email address to test real-time lookups
echo ========================================
pause