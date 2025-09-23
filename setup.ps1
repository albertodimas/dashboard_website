# Nexodash Setup Script for PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Dashboard Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✓ Docker found!" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not installed or not running" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Install Docker Desktop from https://docker.com" -ForegroundColor White
    Write-Host "2. Start Docker Desktop" -ForegroundColor White
    Write-Host "3. Run this script again" -ForegroundColor White
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Docker is running
Write-Host "Checking if Docker is running..." -ForegroundColor Yellow
docker info > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Docker is installed but not running" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "✓ Docker is running!" -ForegroundColor Green
Write-Host ""

# Start Docker services
Write-Host "Starting Docker services..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Services started successfully!" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to start services" -ForegroundColor Red
    exit 1
}

# Wait for services
Write-Host "Waiting for services to be ready (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Setup database
Write-Host ""
Write-Host "Setting up database..." -ForegroundColor Yellow
pnpm db:generate
pnpm db:push
pnpm db:seed

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    ✓ Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: pnpm dev" -ForegroundColor White
Write-Host "2. Open: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Demo accounts:" -ForegroundColor Cyan
Write-Host "• owner@luxurycuts.com / password123" -ForegroundColor White
Write-Host "• owner@glamournails.com / password123" -ForegroundColor White
Write-Host ""
Write-Host "Services running:" -ForegroundColor Cyan
Write-Host "• PostgreSQL: localhost:5432" -ForegroundColor White
Write-Host "• Redis: localhost:6379" -ForegroundColor White
Write-Host "• Mailhog: http://localhost:8025" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"
