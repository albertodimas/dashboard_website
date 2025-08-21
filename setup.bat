@echo off
echo ========================================
echo    Dashboard Setup Script
echo ========================================
echo.

echo Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker Desktop from https://docker.com
    pause
    exit /b 1
)

echo Docker found!
echo.

echo Starting Docker services...
docker-compose up -d

echo Waiting for services to start (30 seconds)...
timeout /t 30 /nobreak >nul

echo.
echo Setting up database...
call pnpm db:generate
call pnpm db:push
call pnpm db:seed

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo You can now run: pnpm dev
echo Then open: http://localhost:3000
echo.
echo Demo accounts:
echo - owner@luxurycuts.com / password123
echo - owner@glamournails.com / password123
echo.
pause