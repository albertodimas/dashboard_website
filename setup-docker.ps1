# Dashboard Docker Setup Script
$dockerPath = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"
$dockerComposePath = "C:\Program Files\Docker\Docker\resources\bin\docker-compose.exe"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Dashboard Docker Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Verificando Docker..." -ForegroundColor Yellow
$dockerRunning = $false
$attempts = 0

while (-not $dockerRunning -and $attempts -lt 10) {
    $attempts++
    try {
        & $dockerPath ps 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $dockerRunning = $true
            Write-Host "✓ Docker está funcionando!" -ForegroundColor Green
        }
    } catch {}
    
    if (-not $dockerRunning) {
        Write-Host "Esperando a Docker... (intento $attempts/10)" -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
}

if (-not $dockerRunning) {
    Write-Host "✗ Docker no está respondiendo" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor asegúrate de que Docker Desktop esté abierto y muestre:" -ForegroundColor Yellow
    Write-Host "'Docker Desktop is running' en la parte inferior" -ForegroundColor White
    Write-Host ""
    Write-Host "Si acabas de instalar Docker, puede necesitar reiniciar Windows." -ForegroundColor Yellow
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host ""
Write-Host "Iniciando servicios Docker..." -ForegroundColor Yellow

# Update docker-compose.yml to remove version
$composeContent = @'
services:
  postgres:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_USER: dashboard
      POSTGRES_PASSWORD: dashboard
      POSTGRES_DB: dashboard
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dashboard"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  postgres_data:
  redis_data:
'@

$composeContent | Out-File -FilePath "docker-compose.yml" -Encoding utf8

# Start services
& $dockerComposePath up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Servicios Docker iniciados!" -ForegroundColor Green
} else {
    Write-Host "✗ Error al iniciar servicios" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Esperando a que PostgreSQL esté listo (30 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "Configurando base de datos..." -ForegroundColor Yellow

# Generate Prisma client
pnpm db:generate

# Push database schema
pnpm db:push

# Seed database
pnpm db:seed

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    ✓ Setup Completo!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Servicios funcionando:" -ForegroundColor Cyan
Write-Host "• PostgreSQL: localhost:5432" -ForegroundColor White
Write-Host "• Redis: localhost:6379" -ForegroundColor White
Write-Host "• Mailhog: http://localhost:8025" -ForegroundColor White
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Ejecuta: pnpm dev" -ForegroundColor White
Write-Host "2. Abre: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Cuentas demo:" -ForegroundColor Cyan
Write-Host "• owner@luxurycuts.com / password123" -ForegroundColor White
Write-Host "• owner@glamournails.com / password123" -ForegroundColor White
Write-Host ""
Read-Host "Presiona Enter para salir"