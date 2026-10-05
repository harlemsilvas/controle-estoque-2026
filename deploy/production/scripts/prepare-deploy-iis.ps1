param(
  [string]$IisRoot = 'C:\inetpub\controle-estoque-proxy',
  [int]$BackendPort = 4300
)
$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$deployRoot = Split-Path -Parent $scriptDir
$repoRoot = Split-Path -Parent (Split-Path -Parent $deployRoot)
$backendSource = Join-Path $repoRoot 'back-end'
$frontendSource = Join-Path $repoRoot 'front-end'
$backendTarget = Join-Path $deployRoot 'backend'
$runtimeEnv = Join-Path $backendTarget '.env'
if (-not (Test-Path $runtimeEnv)) {
  $runtimeEnv = Join-Path $backendSource '.env'
}
if (-not (Test-Path $runtimeEnv)) { throw 'Configure o .env do backend no servidor antes do deploy.' }
if ($BackendPort -lt 1 -or $BackendPort -gt 65535) { throw 'Porta invalida.' }
# O operador para somente o backend deste projeto antes de publicar.
if (Get-NetTCPConnection -State Listen -LocalPort $BackendPort -ErrorAction SilentlyContinue) {
  throw "Pare o backend deste projeto na porta $BackendPort antes do deploy. Nenhum processo foi encerrado pelo script."
}
function Invoke-Npm {
  param([string]$Directory, [string[]]$Arguments)
  Push-Location $Directory
  try {
    & npm @Arguments
    if ($LASTEXITCODE -ne 0) { throw "npm falhou em $Directory" }
  } finally { Pop-Location }
}
Invoke-Npm -Directory $backendSource -Arguments @('ci', '--include=dev')
Invoke-Npm -Directory $frontendSource -Arguments @('ci', '--include=dev')
# Preflight valida o .env de producao e a estrutura no banco sem alterar dados.
Push-Location $backendSource
try {
  & node 'scripts/check-deploy.cjs' $runtimeEnv
  if ($LASTEXITCODE -ne 0) { throw 'Preflight de configuracao/banco falhou.' }
} finally { Pop-Location }
Invoke-Npm -Directory $backendSource -Arguments @('run', 'build')
$oldApi = $env:VITE_API_BASE_URL
try {
  $env:VITE_API_BASE_URL = '/api'
  Invoke-Npm -Directory $frontendSource -Arguments @('run', 'build')
} finally {
  if ($null -eq $oldApi) { Remove-Item Env:VITE_API_BASE_URL -ErrorAction SilentlyContinue }
  else { $env:VITE_API_BASE_URL = $oldApi }
}
# Preservar .env, logs/session-revocations.json, configuracao IIS e assets anteriores.
New-Item -ItemType Directory -Force -Path $backendTarget, $IisRoot | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $backendTarget 'scripts') | Out-Null
Copy-Item -Recurse -Force (Join-Path $backendSource 'dist') $backendTarget
Copy-Item -Force (Join-Path $backendSource 'package.json') $backendTarget
Copy-Item -Force (Join-Path $backendSource 'package-lock.json') $backendTarget
Copy-Item -Force (Join-Path $backendSource 'scripts\free-port.js') (Join-Path $backendTarget 'scripts\free-port.js')
if (-not (Test-Path (Join-Path $backendTarget '.env'))) {
  Copy-Item -Force $runtimeEnv (Join-Path $backendTarget '.env')
}
Invoke-Npm -Directory $backendTarget -Arguments @('ci', '--omit=dev')
# Publicar assets antes do index para reduzir referencias a arquivos ausentes.
Copy-Item -Recurse -Force (Join-Path $frontendSource 'dist\assets') $IisRoot
Get-ChildItem (Join-Path $frontendSource 'dist') -File | Where-Object { $_.Name -notin @('index.html', 'web.config') } | ForEach-Object { Copy-Item $_.FullName $IisRoot -Force }
Copy-Item -Force (Join-Path $frontendSource 'dist\index.html') $IisRoot
Write-Host '[deploy] Arquivos publicados. Reinicie o backend e valide /api/health e login no IIS.'
Write-Host '[deploy] web.config preservado: confira proxy /api/* -> backend sem prefixo /api.'
