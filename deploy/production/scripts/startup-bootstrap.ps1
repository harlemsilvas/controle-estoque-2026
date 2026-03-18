$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$deployRoot = Split-Path -Parent $scriptDir
$backendDir = Join-Path $deployRoot 'backend'
$logsDir = Join-Path $deployRoot 'logs'
$ecosystemPath = Join-Path $scriptDir 'ecosystem.config.cjs'
$pm2Home = Join-Path $deployRoot '.pm2'

New-Item -ItemType Directory -Force -Path $logsDir | Out-Null
New-Item -ItemType Directory -Force -Path $pm2Home | Out-Null

$env:PM2_HOME = $pm2Home

function Get-ExecutablePath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$CommandName
  )

  $command = Get-Command $CommandName -ErrorAction SilentlyContinue
  if ($command -and $command.Path) {
    return $command.Path
  }

  return $null
}

function Ensure-Pm2 {
  $pm2Path = Get-ExecutablePath -CommandName 'pm2'
  if ($pm2Path) {
    return $pm2Path
  }

  $npmPath = Get-ExecutablePath -CommandName 'npm'
  if (-not $npmPath) {
    throw 'npm nao encontrado. Instale Node.js com npm para usar PM2.'
  }

  Write-Host '[startup] PM2 nao encontrado no PATH. Tentando instalar globalmente...'
  & $npmPath install -g pm2
  if ($LASTEXITCODE -ne 0) {
    throw 'Falha ao instalar PM2 globalmente.'
  }

  $pm2Path = Get-ExecutablePath -CommandName 'pm2'
  if (-not $pm2Path) {
    throw 'PM2 instalado, mas nao foi encontrado no PATH.'
  }

  return $pm2Path
}

function Start-WithPm2 {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Pm2Path
  )

  if (-not (Test-Path $ecosystemPath)) {
    throw "Arquivo de ecosystem nao encontrado: $ecosystemPath"
  }

  if (-not (Test-Path (Join-Path $backendDir 'dist\app.js'))) {
    throw 'Backend compilado nao encontrado em deploy/production/backend/dist/app.js.'
  }

  & $Pm2Path startOrRestart $ecosystemPath --update-env
  if ($LASTEXITCODE -ne 0) {
    throw 'Falha ao iniciar processos no PM2.'
  }

  & $Pm2Path save --force
  if ($LASTEXITCODE -ne 0) {
    throw 'Falha ao salvar estado do PM2.'
  }

  & $Pm2Path ls
}

try {
  $pm2Path = Ensure-Pm2
  Start-WithPm2 -Pm2Path $pm2Path
  Write-Host '[startup] Stack iniciado com PM2 com sucesso.'
}
catch {
  Write-Warning "[startup] PM2 indisponivel ou falhou: $($_.Exception.Message)"
  Write-Host '[startup] Aplicando fallback para scripts nativos (start-backend/start-frontend).'

  & (Join-Path $scriptDir 'start-backend.ps1')
  & (Join-Path $scriptDir 'start-frontend.ps1')
}
