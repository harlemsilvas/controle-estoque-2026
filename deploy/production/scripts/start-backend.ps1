$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$deployRoot = Split-Path -Parent $scriptDir
$backendDir = Join-Path $deployRoot 'backend'
$logsDir = Join-Path $deployRoot 'logs'

New-Item -ItemType Directory -Force -Path $logsDir | Out-Null

$env:PORT = if ($env:PORT) { $env:PORT } else { '4300' }
$env:NODE_ENV = 'production'

function Get-NodeExecutable {
  $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
  if ($nodeCommand -and $nodeCommand.Path) {
    return $nodeCommand.Path
  }

  $candidates = @(
    'C:\Program Files\nodejs\node.exe',
    'C:\Program Files (x86)\nodejs\node.exe'
  )

  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  throw 'Node.js nao encontrado. Instale o Node.js em C:\Program Files\nodejs\node.exe.'
}

function Test-PortListening {
  param(
    [Parameter(Mandatory = $true)]
    [int]$Port
  )

  return [bool](Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue)
}

$nodeExe = Get-NodeExecutable
$maxAttempts = 3

Push-Location $backendDir
try {
  for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
    & $nodeExe (Join-Path $scriptDir 'free-port.js')

    Start-Process -FilePath $nodeExe -WorkingDirectory $backendDir -ArgumentList 'dist/app.js' -RedirectStandardOutput (Join-Path $logsDir 'backend.log') -RedirectStandardError (Join-Path $logsDir 'backend-error.log') | Out-Null

    Start-Sleep -Seconds 3
    if (Test-PortListening -Port ([int]$env:PORT)) {
      Write-Host "[backend] Inicializado na porta $($env:PORT)."
      break
    }

    if ($attempt -eq $maxAttempts) {
      throw "[backend] Falha ao inicializar na porta $($env:PORT) apos $maxAttempts tentativas."
    }

    Write-Host "[backend] Tentativa $attempt falhou. Repetindo inicializacao..."
  }
} finally {
  Pop-Location
}
