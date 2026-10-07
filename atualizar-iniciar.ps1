[CmdletBinding()]
param(
  [string]$ApiHost = '192.168.0.69',
  [ValidateRange(1,65535)][int]$BackendPort = 4300,
  [ValidateRange(1,65535)][int]$FrontendPort = 4173,
  [string]$Pm2Home,
  [string]$ToolDirectory = 'C:\Users\Harlem\AppData\Roaming\npm',
  [string]$BackendName = 'controle-estoque-backend',
  [string]$FrontendName = 'controle-estoque-frontend',
  [switch]$Preparar,
  [switch]$SemAtualizacao
)
$ErrorActionPreference = 'Stop'
$repoRoot = $PSScriptRoot
$releaseRoot = Join-Path $repoRoot 'deploy\production\releases'
$stateRoot = Join-Path $repoRoot 'logs\startup'
$stateFile = Join-Path $stateRoot 'active-release.json'
$statusFile = Join-Path $stateRoot 'status.txt'
$lock = $null
$stage = 'validacao'
$changedRuntime = $false
$previousState = $null
$rollbackConfig = $null
$oldApi = $env:VITE_API_BASE_URL
$oldPm2 = $env:PM2_HOME
$oldOptions = $env:NODE_OPTIONS
function Status([string]$Message) {
  Set-Content -LiteralPath $statusFile -Value ((Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ' ' + $Message) -Encoding utf8
  Write-Host $Message
}
function Tool([string]$Name,[string]$Fallback) {
  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  if (Test-Path -LiteralPath $Fallback) { return $Fallback }
  throw 'Ferramenta obrigatoria indisponivel.'
}
function Checked([string]$Executable,[string[]]$Arguments,[string]$Directory) {
  Push-Location $Directory
  $oldPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = 'Continue'
    if ($Executable -eq $git) { $Arguments = @('-c',('safe.directory=' + $repoRoot)) + $Arguments }
    & $Executable @Arguments *> $null
    $code = $LASTEXITCODE
  } finally { $ErrorActionPreference = $oldPreference; Pop-Location }
  if ($code -ne 0) { throw 'Comando falhou. Valores e saida omitidos.' }
}
function Healthy([int]$ApiPort,[int]$SitePort) {
  for ($attempt = 0; $attempt -lt 15; $attempt++) {
    try {
      $api = Invoke-WebRequest ('http://127.0.0.1:' + $ApiPort + '/health') -UseBasicParsing -TimeoutSec 2
      $site = Invoke-WebRequest ('http://127.0.0.1:' + $SitePort + '/') -UseBasicParsing -TimeoutSec 2
      if ($api.StatusCode -eq 200 -and $site.StatusCode -eq 200) { return $true }
    } catch { }
    Start-Sleep -Seconds 1
  }
  return $false
}
try {
  New-Item -ItemType Directory -Force -Path $stateRoot,$releaseRoot | Out-Null
  try { $lock = [IO.File]::Open((Join-Path $stateRoot 'startup.lock'), 'OpenOrCreate','ReadWrite','None') }
  catch { throw 'Outra inicializacao ja esta em execucao.' }
  $git = Tool 'git.exe' 'C:\Program Files\Git\cmd\git.exe'
  $node = Tool 'node.exe' 'C:\Program Files\nodejs\node.exe'
  $npm = Tool 'npm.cmd' 'C:\Program Files\nodejs\npm.cmd'
  $pm2Module = Join-Path $ToolDirectory 'node_modules\pm2'
  if (-not $Preparar -and -not (Test-Path -LiteralPath $pm2Module)) { throw 'PM2 nao instalado no caminho configurado.' }
  if ($BackendPort -eq $FrontendPort) { throw 'Portas precisam ser diferentes.' }
  if ($ApiHost -notmatch '^[a-zA-Z0-9.-]+$') { throw 'Host invalido.' }
  if (-not $Pm2Home) { $Pm2Home = Join-Path $repoRoot 'deploy\production\.pm2' }
  $env:PM2_HOME = $Pm2Home
  $env:NODE_OPTIONS = (($oldOptions + ' --use-system-ca').Trim())
  Push-Location $repoRoot
  try {
    $remote = (& $git -c ('safe.directory=' + $repoRoot) remote get-url origin | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $remote.TrimEnd('/') -notin @('https://github.com/harlemsilvas/controle-estoque-2026.git','https://github.com/harlemsilvas/controle-estoque-2026')) { throw 'Origem Git inesperada.' }
    $branch = (& $git -c ('safe.directory=' + $repoRoot) branch --show-current | Out-String).Trim()
    if ($branch -ne 'main') { throw 'Use a branch main.' }
    $dirty = @(& $git -c ('safe.directory=' + $repoRoot) status --porcelain --untracked-files=no)
    if ($LASTEXITCODE -ne 0 -or ($dirty.Count -and -not $Preparar)) { throw 'Arquivos versionados alterados; salvar antes de atualizar.' }
    $head = (& $git -c ('safe.directory=' + $repoRoot) rev-parse HEAD | Out-String).Trim()
  } finally { Pop-Location }
  if (-not $SemAtualizacao) {
    $stage = 'consulta ao GitHub'
    Status 'Consultando atualizacao da main.'
    Checked $git @('fetch','--no-tags','origin','main') $repoRoot
  }
  Push-Location $repoRoot
  try { $candidate = if ($SemAtualizacao) { $head } else { (& $git -c ('safe.directory=' + $repoRoot) rev-parse origin/main | Out-String).Trim() } }
  finally { Pop-Location }
  if ($candidate -notmatch '^[a-f0-9]{40}$') { throw 'Commit invalido.' }
  Checked $git @('merge-base','--is-ancestor',$head,$candidate) $repoRoot
  $envFile = Join-Path $repoRoot 'back-end\.env'
  if (-not (Test-Path -LiteralPath $envFile)) { throw 'Configure back-end/.env antes de iniciar.' }
  $release = Join-Path $releaseRoot ($candidate.Substring(0,12) + '-' + [guid]::NewGuid().ToString('N').Substring(0,8))
  $zipFile = $release + '.zip'
  $stage = 'preparacao da versao'
  Checked $git @('archive','--format=zip',('--output=' + $zipFile),$candidate) $repoRoot
  Expand-Archive -LiteralPath $zipFile -DestinationPath $release
  # Somente artefato temporario verificado, sem exclusao recursiva.
  if ([IO.Path]::GetFullPath($zipFile).StartsWith([IO.Path]::GetFullPath($releaseRoot) + '\')) { Remove-Item -LiteralPath $zipFile }
  $backend = Join-Path $release 'back-end'
  $frontend = Join-Path $release 'front-end'
  Copy-Item -LiteralPath $envFile -Destination (Join-Path $backend '.env')
  $stage = 'dependencias backend'
  Status 'Instalando dependencias backend e frontend em diretorio separado.'
  Checked $npm @('ci','--include=dev','--ignore-scripts','--no-audit','--no-fund') $backend
  $stage = 'dependencias frontend'
  Checked $npm @('ci','--include=dev','--ignore-scripts','--no-audit','--no-fund') $frontend
  $stage = 'build backend'
  Status 'Compilando backend e frontend.'
  Checked $npm @('run','build') $backend
  $env:VITE_API_BASE_URL = 'http://' + $ApiHost + ':' + $BackendPort
  $stage = 'build frontend'
  Checked $npm @('run','build') $frontend
  $stage = 'validacao de configuracao'
  Checked $node @('scripts/check-deploy.cjs',(Join-Path $backend '.env')) $backend
  Checked $npm @('prune','--omit=dev','--ignore-scripts','--no-audit','--no-fund') $backend
  foreach ($required in @((Join-Path $backend 'dist\app.js'),(Join-Path $frontend 'dist\index.html'))) {
    if (-not (Test-Path -LiteralPath $required)) { throw 'Artefato ausente.' }
  }
  Copy-Item -LiteralPath (Join-Path $repoRoot 'scripts\serve-site.cjs') -Destination (Join-Path $release 'serve-site.cjs')
  $config = Join-Path $release 'ecosystem.json'
  $sessionFile = Join-Path $repoRoot 'logs\session-revocations.json'
  $apps = @(
    @{name=$BackendName;script=(Join-Path $backend 'dist\app.js');cwd=$backend;interpreter=$node;watch=$false;autorestart=$true;restart_delay=5000;env=@{NODE_ENV='production';PORT="$BackendPort";APP_PUBLIC_URL=("http://" + $ApiHost + ":" + $FrontendPort);SESSION_REVOCATION_FILE=$sessionFile}},
    @{name=$FrontendName;script=(Join-Path $release 'serve-site.cjs');cwd=$release;interpreter=$node;watch=$false;autorestart=$true;restart_delay=5000;env=@{NODE_ENV='production';FRONTEND_PORT="$FrontendPort";FRONTEND_ROOT=(Join-Path $frontend 'dist')}}
  )
  @{apps=$apps} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $config -Encoding utf8
  if ($Preparar) { Status ('PREPARADO: ' + $release + '. PM2 e fontes nao alterados.'); return }
  # A conta da tarefa pode controlar seu proprio daemon sem UAC; a API PM2 valida o acesso real.
  $stage = 'validacao PM2'
  $knownJson = (& $node (Join-Path $repoRoot 'scripts\pm2-control.cjs') $pm2Module 'list' | Out-String)
  if ($LASTEXITCODE -ne 0) { throw 'Sem acesso ao PM2 existente.' }
  $known = $knownJson | ConvertFrom-Json
  foreach ($pair in @(@{name=$BackendName;port=$BackendPort},@{name=$FrontendName;port=$FrontendPort})) {
    $owners = @(Get-NetTCPConnection -State Listen -LocalPort $pair.port -ErrorAction SilentlyContinue)
    $expected = @($known | Where-Object { $_.name -eq $pair.name } | Select-Object -ExpandProperty pid)
    foreach ($owner in $owners) { if ($owner.OwningProcess -notin $expected) { throw 'Porta ocupada por outro processo; nenhum processo encerrado.' } }
  }
  if (Test-Path -LiteralPath $stateFile) { $previousState = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json }
  $rollbackJson = (& $node (Join-Path $repoRoot 'scripts\pm2-control.cjs') $pm2Module 'snapshot' $config | Out-String)
  if ($LASTEXITCODE -ne 0) { throw 'Snapshot PM2 falhou.' }
  $rollback = $rollbackJson | ConvertFrom-Json
  if ($rollback.apps.Count -eq 2) {
    $rollbackConfig = Join-Path $stateRoot 'previous-ecosystem.json'
    $rollbackJson | Set-Content -LiteralPath $rollbackConfig -Encoding utf8
    # Preservar revogacoes da API anterior antes da primeira troca de runtime.
    $oldBackend = $rollback.apps | Where-Object { $_.name -eq $BackendName } | Select-Object -First 1
    $oldRevocations = if ($oldBackend.env.SESSION_REVOCATION_FILE) { $oldBackend.env.SESSION_REVOCATION_FILE } else { Join-Path $oldBackend.cwd 'logs\session-revocations.json' }
    if (-not (Test-Path -LiteralPath $sessionFile) -and (Test-Path -LiteralPath $oldRevocations)) {
      Copy-Item -LiteralPath $oldRevocations -Destination $sessionFile
    }
  }
  $stage = 'atualizacao Git'
  Checked $git @('merge','--ff-only',$candidate) $repoRoot
  $stage = 'troca de versao PM2'
  $changedRuntime = $true
  Checked $node @((Join-Path $repoRoot 'scripts\pm2-control.cjs'),$pm2Module,'apply',$config) $repoRoot
  if (-not (Healthy $BackendPort $FrontendPort)) { throw 'Nova versao nao passou health/frontend.' }
  @{commit=$candidate;config=$config;backendPort=$BackendPort;frontendPort=$FrontendPort;pm2Home=$Pm2Home} | ConvertTo-Json | Set-Content -LiteralPath $stateFile -Encoding utf8
  # Este script de boot inicia a versao validada; nao depende de pm2 resurrect/dump.
  Status ('OK: ' + $candidate.Substring(0,7) + ' em http://' + $ApiHost + ':' + $FrontendPort)
} catch {
  $failedStage = $stage
  if ($changedRuntime -and $rollbackConfig -and (Test-Path -LiteralPath $rollbackConfig)) {
    try {
      Checked $node @((Join-Path $repoRoot 'scripts\pm2-control.cjs'),$pm2Module,'apply',$rollbackConfig) $repoRoot
      if (Healthy $BackendPort $FrontendPort) { Status ('AVISO: falha em ' + $failedStage + '; processos anteriores restaurados.'); return }
    } catch { }
  }
  if (-not $Preparar -and (Test-Path -LiteralPath $stateFile)) {
    try {
      $last = if ($previousState) { $previousState } else { Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json }
      $env:PM2_HOME = $last.pm2Home
      $restoreMode = if ($changedRuntime) { 'apply' } else { 'ensure' }
      Checked $node @((Join-Path $repoRoot 'scripts\pm2-control.cjs'),$pm2Module,$restoreMode,$last.config) $repoRoot
      if (-not (Healthy $last.backendPort $last.frontendPort)) { throw 'Versao anterior indisponivel.' }
      Status ('AVISO: falha em ' + $failedStage + '; versao validada anterior preservada/iniciada.')
      return
    } catch { }
  }
  if (Test-Path -LiteralPath $stateRoot) { Status ('FALHA em ' + $failedStage + '. Nenhum segredo registrado; conferir configuracao e ferramentas.') }
  throw ('Inicializacao interrompida em ' + $failedStage + '.')
} finally {
  $env:VITE_API_BASE_URL = $oldApi
  $env:PM2_HOME = $oldPm2
  $env:NODE_OPTIONS = $oldOptions
  if ($lock) { $lock.Dispose() }
}




