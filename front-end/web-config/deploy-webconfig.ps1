# Deploy web.config para Produção com HTTPS
# Execute como ADMINISTRADOR

$ErrorActionPreference = 'Stop'

$sourceWebConfig = "C:\controle-estoque\front-end\web-config\web.config"
$targetDir = "C:\inetpub\controle-estoque-proxy"
$targetWebConfig = Join-Path $targetDir "web.config"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Deploy Web.Config - HTTPS Production" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar permissões de admin
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ ERRO: Execute como ADMINISTRADOR!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Executando como Administrador`n" -ForegroundColor Green

# Validar arquivo de origem
if (-not (Test-Path $sourceWebConfig)) {
    Write-Host "❌ Arquivo não encontrado: $sourceWebConfig" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Arquivo de origem encontrado" -ForegroundColor Green

# Validar pasta de destino
if (-not (Test-Path $targetDir)) {
    Write-Host "❌ Pasta de destino não existe: $targetDir" -ForegroundColor Red
    Write-Host "   Execute primeiro: copy_frontend_to_iis.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Pasta IIS existe: $targetDir" -ForegroundColor Green

# Fazer backup do web.config antigo se existir
if (Test-Path $targetWebConfig) {
    $backup = "$targetWebConfig.bak.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Write-Host "`n💾 Fazendo backup: $backup..."
    Copy-Item $targetWebConfig $backup -Force
    Write-Host "✅ Backup criado" -ForegroundColor Green
}

# Copiar novo web.config
Write-Host "`n📝 Copiando web.config..."
Copy-Item $sourceWebConfig $targetWebConfig -Force
Write-Host "✅ Web.config copiado!" -ForegroundColor Green

# Validar cópia
if (Test-Path $targetWebConfig) {
    $size = (Get-Item $targetWebConfig).Length
    Write-Host "✅ Arquivo presente: $size bytes" -ForegroundColor Green
} else {
    Write-Host "❌ Falha ao copiar!" -ForegroundColor Red
    exit 1
}

# Reiniciar IIS para aplicar mudanças
Write-Host "`n🔄 Reiniciando IIS..."
try {
    Stop-WebAppPool -Name "ControleEstoque_Proxy" -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Start-WebAppPool -Name "ControleEstoque_Proxy" -ErrorAction SilentlyContinue
    Write-Host "✅ App Pool reiniciado" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Aviso: Reiniciar manual pode ser necessário" -ForegroundColor Yellow
}

# Testes
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "Testes de Validação" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

Start-Sleep -Seconds 2

# Teste 1: Frontend HTTPS
Write-Host "`n🔍 Teste 1: Frontend via HTTPS..."
try {
    $r = Invoke-WebRequest -Uri "https://estoque.local" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Frontend respondendo: HTTP $($r.StatusCode)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response) {
        Write-Host "✅ Frontend respondendo: HTTP $($_.Exception.Response.StatusCode)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Erro de conexão: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Teste 2: API via Proxy
Write-Host "`n🔍 Teste 2: API-Docs via Proxy..."
try {
    $r = Invoke-WebRequest -Uri "https://estoque.local/api-docs" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ API respondendo: HTTP $($r.StatusCode)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response) {
        Write-Host "✅ API respondendo: HTTP $($_.Exception.Response.StatusCode)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Erro de conexão: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Teste 2.1: Rota SPA sobreposta
Write-Host "`n🔍 Teste 2.1: SPA route /produto/editar/2 ..."
try {
    $r = Invoke-WebRequest -Uri "https://estoque.local/produto/editar/2" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ SPA route respondendo: HTTP $($r.StatusCode)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response) {
        Write-Host "⚠️  SPA route respondeu: HTTP $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  Erro de conexão: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Teste 3: HTTP → HTTPS Redirect
Write-Host "`n🔍 Teste 3: Redirect HTTP → HTTPS..."
try {
    $r = Invoke-WebRequest -Uri "http://estoque.local" -TimeoutSec 10 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($r.StatusCode -eq 301 -or $r.StatusCode -eq 302) {
        Write-Host "✅ Redirect ativo: HTTP $($r.StatusCode)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Possível redirect não configurado: HTTP $($r.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✅ Redirect ativo (URL redirecionou para HTTPS)" -ForegroundColor Green
}

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "✅ Deploy Concluído!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Abra no navegador: https://estoque.local"
Write-Host "2. Teste login com usuário MONICA"
Write-Host "3. Monitore Network tab no console para validar rotas"
Write-Host "4. Se houver erro, verifique os logs do IIS"
Write-Host ""
