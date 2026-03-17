$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$deployRoot = Split-Path -Parent $scriptDir
$repoRoot = Split-Path -Parent (Split-Path -Parent $deployRoot)
$backendSource = Join-Path $repoRoot 'back-end'
$frontendSource = Join-Path $repoRoot 'front-end'
$backendTarget = Join-Path $deployRoot 'backend'
$frontendTarget = Join-Path $deployRoot 'frontend'
$configTarget = Join-Path $deployRoot 'config'

Write-Host '[deploy] Iniciando build do backend...'
Push-Location $backendSource
npm run build
Pop-Location

Write-Host '[deploy] Iniciando build do frontend...'
Push-Location $frontendSource
npm run build
Pop-Location

Write-Host '[deploy] Limpando artefatos anteriores...'
if (Test-Path $backendTarget) { Remove-Item -Recurse -Force $backendTarget }
if (Test-Path $frontendTarget) { Remove-Item -Recurse -Force $frontendTarget }
New-Item -ItemType Directory -Force -Path $backendTarget | Out-Null
New-Item -ItemType Directory -Force -Path $frontendTarget | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $backendTarget 'scripts') | Out-Null

Write-Host '[deploy] Copiando backend...'
Copy-Item -Recurse -Force (Join-Path $backendSource 'dist') $backendTarget
Copy-Item -Force (Join-Path $backendSource 'package.json') $backendTarget
Copy-Item -Force (Join-Path $backendSource 'package-lock.json') $backendTarget
Copy-Item -Force (Join-Path $backendSource 'scripts\free-port.js') (Join-Path $backendTarget 'scripts\free-port.js')
if (Test-Path (Join-Path $backendSource '.env')) {
  Copy-Item -Force (Join-Path $backendSource '.env') (Join-Path $backendTarget '.env')
}
if (Test-Path (Join-Path $configTarget 'back-end.env.example')) {
  Copy-Item -Force (Join-Path $configTarget 'back-end.env.example') (Join-Path $backendTarget '.env.example')
}

Write-Host '[deploy] Copiando frontend...'
Copy-Item -Recurse -Force (Join-Path $frontendSource 'dist') $frontendTarget
if (Test-Path (Join-Path $configTarget 'front-end.env.production')) {
  Copy-Item -Force (Join-Path $configTarget 'front-end.env.production') (Join-Path $frontendTarget '.env.production')
}

Write-Host '[deploy] Deploy preparado em' $deployRoot
