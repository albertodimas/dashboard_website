Write-Host "Esperando a que Docker Desktop esté listo..." -ForegroundColor Yellow
Write-Host "Esto puede tomar 1-2 minutos en el primer inicio" -ForegroundColor Cyan

$dockerPath = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"
$attempts = 0
$maxAttempts = 30

while ($attempts -lt $maxAttempts) {
    $attempts++
    Write-Host "Intento $attempts de $maxAttempts..." -NoNewline
    
    try {
        & $dockerPath ps 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✓ Docker está listo!" -ForegroundColor Green
            break
        }
    } catch {
        # Docker not ready yet
    }
    
    Write-Host " Esperando..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

if ($attempts -eq $maxAttempts) {
    Write-Host "Docker no se pudo iniciar correctamente." -ForegroundColor Red
    Write-Host "Por favor:" -ForegroundColor Yellow
    Write-Host "1. Abre Docker Desktop manualmente desde el escritorio" -ForegroundColor White
    Write-Host "2. Espera a que muestre 'Docker Desktop is running'" -ForegroundColor White
    Write-Host "3. Ejecuta este script nuevamente" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "✓ Docker está funcionando correctamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ahora puedes ejecutar:" -ForegroundColor Cyan
    Write-Host "  .\setup.ps1" -ForegroundColor White
    Write-Host "Para configurar el proyecto completo" -ForegroundColor Cyan
}

Read-Host "Presiona Enter para continuar"