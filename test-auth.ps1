# Test Authentication System
Write-Host "Testing Dashboard Authentication System" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:3002"

# Test 1: Register a new account
Write-Host "`nTest 1: Creating new account..." -ForegroundColor Yellow
$registerBody = @{
    email = "test@example.com"
    password = "testpass123"
    name = "Test User"
    businessName = "Test Business"
    subdomain = "testbiz"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerBody `
        -SessionVariable session `
        -ErrorAction Stop
    
    Write-Host "[OK] Registration successful!" -ForegroundColor Green
    $registerResult = $response.Content | ConvertFrom-Json
    Write-Host "  User ID: $($registerResult.user.id)"
} catch {
    Write-Host "[FAIL] Registration failed: $_" -ForegroundColor Red
}

# Test 2: Login with the account
Write-Host "`nTest 2: Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = "test@example.com"
    password = "testpass123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -WebSession $session `
        -ErrorAction Stop
    
    Write-Host "[OK] Login successful!" -ForegroundColor Green
    $loginResult = $response.Content | ConvertFrom-Json
    Write-Host "  Session created for: $($loginResult.user.email)"
} catch {
    Write-Host "[FAIL] Login failed: $_" -ForegroundColor Red
}

# Test 3: Access protected route
Write-Host "`nTest 3: Accessing protected dashboard..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/me" `
        -Method GET `
        -WebSession $session `
        -ErrorAction Stop
    
    Write-Host "[OK] Protected route accessible!" -ForegroundColor Green
    $meResult = $response.Content | ConvertFrom-Json
    Write-Host "  Authenticated as: $($meResult.user.name) ($($meResult.user.email))"
} catch {
    Write-Host "[FAIL] Protected route failed: $_" -ForegroundColor Red
}

# Test 4: Logout
Write-Host "`nTest 4: Logging out..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/logout" `
        -Method POST `
        -WebSession $session `
        -ErrorAction Stop
    
    Write-Host "[OK] Logout successful!" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Logout failed: $_" -ForegroundColor Red
}

# Test 5: Verify logout worked
Write-Host "`nTest 5: Verifying logout..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/me" `
        -Method GET `
        -WebSession $session `
        -ErrorAction Stop
    
    Write-Host "[FAIL] Still authenticated after logout!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "[OK] Successfully logged out (401 returned)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected error: $_" -ForegroundColor Red
    }
}

Write-Host "`n=======================================" -ForegroundColor Cyan
Write-Host "Authentication tests complete!" -ForegroundColor Cyan
Write-Host "`nYou can now access the application at:" -ForegroundColor White
Write-Host "  $baseUrl" -ForegroundColor Cyan
Write-Host "`nAvailable pages:" -ForegroundColor White
Write-Host "  - Home: $baseUrl" -ForegroundColor Gray
Write-Host "  - Login: $baseUrl/login" -ForegroundColor Gray
Write-Host "  - Register: $baseUrl/register" -ForegroundColor Gray
Write-Host "  - Dashboard: $baseUrl/dashboard (requires login)" -ForegroundColor Gray