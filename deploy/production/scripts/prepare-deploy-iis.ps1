$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$deployRoot = Split-Path -Parent $scriptDir
$repoRoot = Split-Path -Parent (Split-Path -Parent $deployRoot)
$backendSource = Join-Path $repoRoot 'back-end'
$frontendSource = Join-Path $repoRoot 'front-end'

# Caminhos de deploy
$backendTarget = Join-Path $deployRoot 'backend'
$iisRoot = 'C:\inetpub\controle-estoque-proxy'

Write-Host '[deploy] ========================================' -ForegroundColor Cyan
Write-Host '[deploy] Building para Production + IIS' -ForegroundColor Cyan
Write-Host '[deploy] ========================================' -ForegroundColor Cyan

# Build Backend
Write-Host '[deploy] 📦 Compilando backend TypeScript...' -ForegroundColor Yellow
Push-Location $backendSource
npm run build
if ($LASTEXITCODE -ne 0) { throw "Backend build falhou" }
Pop-Location

# Build Frontend
Write-Host '[deploy] 📦 Compilando frontend with Vite...' -ForegroundColor Yellow
Push-Location $frontendSource
npm run build
if ($LASTEXITCODE -ne 0) { throw "Frontend build falhou" }
Pop-Location

Write-Host '[deploy] 🧹 Limpando artefatos anteriores...' -ForegroundColor Yellow

# Parar qualquer processo Node rodando
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Limpar backend deploy
if (Test-Path $backendTarget) { 
    Remove-Item -Recurse -Force $backendTarget 
    Write-Host "  ✓ Removido: $backendTarget"
}

# Limpar frontend no IIS
if (Test-Path $iisRoot) { 
    Remove-Item -Recurse -Force "$iisRoot\*" -ErrorAction SilentlyContinue
    Write-Host "  ✓ Limpado: $iisRoot"
} else {
    New-Item -ItemType Directory -Force -Path $iisRoot | Out-Null
    Write-Host "  ✓ Criado: $iisRoot"
}

# Criar estruturas
New-Item -ItemType Directory -Force -Path $backendTarget | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $backendTarget 'scripts') | Out-Null

# ============================================
# Deploy Backend
# ============================================
Write-Host '[deploy] 📤 Deployando Backend...' -ForegroundColor Green
Copy-Item -Recurse -Force (Join-Path $backendSource 'dist') $backendTarget
Copy-Item -Force (Join-Path $backendSource 'package.json') $backendTarget
Copy-Item -Force (Join-Path $backendSource 'package-lock.json') $backendTarget
Copy-Item -Force (Join-Path $backendSource 'scripts\free-port.js') (Join-Path $backendTarget 'scripts\free-port.js')

# Copiar .env se existir
if (Test-Path (Join-Path $backendSource '.env')) {
    Copy-Item -Force (Join-Path $backendSource '.env') (Join-Path $backendTarget '.env')
    Write-Host "  ✓ .env copiado"
}

Write-Host "  ✓ Backend em: $backendTarget"

# ============================================
# Deploy Frontend para IIS
# ============================================
Write-Host '[deploy] 📤 Deployando Frontend para IIS...' -ForegroundColor Green
Copy-Item -Recurse -Force (Join-Path $frontendSource 'dist\*') $iisRoot

Write-Host "  ✓ Frontend em: $iisRoot"

# ============================================
# Instalar dependências backend
# ============================================
Write-Host '[deploy] 📥 Instalando dependências backend...' -ForegroundColor Yellow
Push-Location $backendTarget
npm install --production
Pop-Location

Write-Host ''
Write-Host '[deploy] ========================================' -ForegroundColor Cyan
Write-Host '[deploy] ✅ Deploy concluído com sucesso!' -ForegroundColor Green
Write-Host '[deploy] ========================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Próximos passos:' -ForegroundColor Cyan
Write-Host '  1. Backend: ' + $backendTarget
Write-Host '  2. Frontend (IIS): ' + $iisRoot
Write-Host '  3. Inicie o backend: node dist/app.js' -ForegroundColor Yellow
Write-Host '  4. Acesse: https://estoque.local' -ForegroundColor Yellow
Write-Host ''
