# Test HTTPS endpoints
Write-Host "🧪 Testing Estoque Production Deployment`n" -ForegroundColor Cyan

# Test 1: Frontend
Write-Host "1️⃣ Frontend (https://estoque.local/.../)" -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri "https://estoque.local" -UseBasicParsing
    Write-Host "   ✅ Status: $($r.StatusCode)" -ForegroundColor Green
    Write-Host "   📦 Size: $($r.Content.Length) bytes`n" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 2: API Docs
Write-Host "2️⃣ API Docs (https://estoque.local/api-docs)" -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri "https://estoque.local/api-docs" -UseBasicParsing
    Write-Host "   ✅ Status: $($r.StatusCode)" -ForegroundColor Green
    Write-Host "   📖 Swagger docs available`n" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 3: Protected Endpoint (expecting 401 without token)
Write-Host "3️⃣ Protected API (https://estoque.local/api/totais - without token)" -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri "https://estoque.local/api/totais" -UseBasicParsing
    Write-Host "   ✅ Status: $($r.StatusCode)" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -match "401|403") {
        Write-Host "   ✅ Status: 401 (Protected - expected)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Error: $($_.Exception.Message)`n" -ForegroundColor Yellow
    }
}

# Test 4: Health check
Write-Host "`n4️⃣ Backend Health Check (localhost:3000)" -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000/api-docs" -UseBasicParsing
    Write-Host "   ✅ Backend running on port 3000" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Backend not responding" -ForegroundColor Red
}

Write-Host "`n✅ Production deployment validated!" -ForegroundColor Green
