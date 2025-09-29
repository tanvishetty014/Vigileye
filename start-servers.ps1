# VIGIL - Start All Servers
# This script starts both the backend and frontend servers

Write-Host "🚀 Starting VIGIL Security Platform..." -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Start Backend Server
Write-Host "🔧 Starting Backend Server..." -ForegroundColor Yellow
Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory "D:\vigil\backend" -WindowStyle Minimized

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Check if backend is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5001/api/health" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend server running on http://localhost:5001" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Backend server may be starting up..." -ForegroundColor Yellow
}

# Start Frontend Server
Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Yellow
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "D:\vigil\frontend1" -WindowStyle Minimized

Write-Host ""
Write-Host "🎉 VIGIL is starting up!" -ForegroundColor Green
Write-Host "📊 Frontend will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend API available at: http://localhost:5001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Both servers are running!" -ForegroundColor Green
Write-Host "Press any key to exit..." -ForegroundColor Gray

$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
