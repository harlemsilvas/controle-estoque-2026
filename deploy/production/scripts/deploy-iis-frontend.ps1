$ErrorActionPreference = 'Continue'

$source = "C:\controle-estoque\front-end\dist"
$dest = "C:\inetpub\controle-estoque-proxy"

Write-Host "DEPLOY Frontend para IIS" -ForegroundColor Cyan
Write-Host "De: $source"
Write-Host "Para: $dest"
Write-Host ""

# Verificar source
if (-not (Test-Path $source)) {
    Write-Host "❌ Fonte não existe: $source" -ForegroundColor Red
    exit 1
}

# Certificar que destination existe
if (-not (Test-Path $dest)) {
    Write-Host "📁 Criando $dest..."
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
}

# Fazer backup web.config se existir
$webConfigPath = "$dest\web.config"
if (Test-Path $webConfigPath) {
    $backup = "$dest\web.config.bak"
    Write-Host "💾 Fazendo backup de web.config..."
    Copy-Item $webConfigPath $backup -Force
}

# Copiar index.html
Write-Host "📄 Copiando index.html..."
Copy-Item "$source\index.html" "$dest\index.html" -Force -ErrorAction Stop

# Copiar assets
if (Test-Path "$source\assets") {
    Write-Host "📦 Copiando pasta assets..."
    Copy-Item "$source\assets" "$dest\assets" -Recurse -Force -ErrorAction Stop
}

# Restaurar web.config
if (Test-Path "$dest\web.config.bak") {
    Write-Host "♻️ Restaurando web.config..."
    Move-Item "$dest\web.config.bak" $webConfigPath -Force
}

Write-Host ""
Write-Host "✅ Deploy concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "Verificando..."
Get-ChildItem $dest -Force | ForEach-Object { Write-Host "  - $($_.Name)" }
