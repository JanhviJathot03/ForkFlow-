@echo off
REM Locus Agents - Quick Start Script (Windows)

echo 🚀 Locus Agents - Setup ^& Start
echo ================================

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker not found. Please install Docker: https://docker.com
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist "backend\.env" (
    echo 📝 Creating backend\.env...
    copy backend\.env.example backend\.env
    echo ⚠️  Please edit backend\.env with your credentials:
    echo    - LOCUS_API_KEY
    echo    - LOCUS_API_SECRET
    echo    - ETHEREUM_RPC_URL
)

REM Create .env.local for frontend if it doesn't exist
if not exist "frontend\.env.local" (
    echo 📝 Creating frontend\.env.local...
    (
        echo NEXT_PUBLIC_API_URL=http://localhost:5000/api
    ) > frontend\.env.local
)

echo 🐳 Starting Docker services...
docker-compose up -d

echo.
echo ✅ Services started!
echo.
echo 📍 URLs:
echo    Frontend:   http://localhost:3000
echo    Backend:    http://localhost:5000
echo    PostgreSQL: localhost:5432
echo    Redis:      localhost:6379
echo.
echo 📊 Check logs:
echo    docker-compose logs -f backend
echo    docker-compose logs -f frontend
echo.
echo 🛑 Stop services:
echo    docker-compose down
echo.
pause
