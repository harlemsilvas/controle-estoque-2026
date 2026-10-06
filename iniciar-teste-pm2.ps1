param([switch]$ElevatedLaunch)
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  if ($ElevatedLaunch) { throw 'O Windows nao concedeu elevacao. Use uma conta administradora.' }
  Write-Host 'Solicitando permissao de administrador ao Windows para acessar o PM2 publicado.'
  $shellPath = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
  $launchArgs = '-NoProfile -ExecutionPolicy Bypass -File "' + $PSCommandPath + '" -ElevatedLaunch'
  try {
    Start-Process -FilePath $shellPath -ArgumentList $launchArgs -Verb RunAs -WindowStyle Hidden -ErrorAction Stop | Out-Null
  } catch { throw 'Elevacao cancelada ou indisponivel. Execute o script em PowerShell como administrador.' }
  Write-Host 'A inicializacao continuara na sessao elevada. Acesse http://localhost:4174 em alguns segundos.'
  return
}
$ErrorActionPreference = 'Stop'
$repoRoot = $PSScriptRoot
$statusPath = Join-Path $repoRoot 'pm2-teste-status.txt'
$stage = 'Abrindo sessao elevada'
Set-Content -LiteralPath $statusPath -Value $stage
trap {
  Set-Content -LiteralPath $statusPath -Value ('Falha na etapa: ' + $stage + '; categoria: ' + $_.CategoryInfo.Category + '; linha: ' + $_.InvocationInfo.ScriptLineNumber)
  break
}
$backendRoot = Join-Path $repoRoot 'back-end'
$frontendDist = Join-Path $repoRoot 'front-end\dist'
$apiName = 'controle-estoque-2026-api-teste'
$webName = 'controle-estoque-2026-web-teste'
$pm2Command = (Get-Command pm2.cmd -ErrorAction Stop).Source
foreach ($requiredFile in @((Join-Path $backendRoot '.env'), (Join-Path $backendRoot 'dist\app.js'), (Join-Path $frontendDist 'index.html'))) {
  if (-not (Test-Path -LiteralPath $requiredFile)) { throw 'Configuracao ou build ausente. Confira os arquivos da nova versao.' }
}
$previousHome = $env:PM2_HOME
$previousPort = $env:PORT
$previousMode = $env:NODE_ENV
try {
  $env:PM2_HOME = 'C:\controle-estoque\deploy\production\.pm2'
  $stage = 'Acesso ao PM2 existente'
  Set-Content -LiteralPath $statusPath -Value $stage
  & $pm2Command list
  if ($LASTEXITCODE -ne 0) { throw 'Sem acesso ao PM2 existente. Use a mesma conta e permissao (PowerShell administrador) da operacao.' }
  $stage = 'Inicio da API 4301'
  Set-Content -LiteralPath $statusPath -Value $stage
  $pm2Module = Join-Path (Split-Path -Parent $pm2Command) 'node_modules\pm2'
  $appsJson = (& node -e "const p=require(process.argv[1]);p.connect(e=>{if(e){process.exitCode=1;p.disconnect();return;}p.list((e,a)=>{if(e){process.exitCode=1;}else{process.stdout.write(JSON.stringify(a.map(x=>({name:x.name}))));}p.disconnect();});});" $pm2Module | Out-String)
  if ($LASTEXITCODE -ne 0) { throw 'Consulta ao PM2 falhou.' }
  $apps = $appsJson | ConvertFrom-Json
  $env:PORT = '4301'
  $env:NODE_ENV = 'production'
  if (@($apps | Where-Object { $_.name -eq $apiName }).Count -gt 0) {
    & $pm2Command restart $apiName --update-env
  } else {
    if (Get-NetTCPConnection -State Listen -LocalPort 4301 -ErrorAction SilentlyContinue) { throw 'Porta 4301 ocupada. Nenhum processo sera encerrado.' }
    & $pm2Command start (Join-Path $backendRoot 'dist\app.js') --cwd $backendRoot --name $apiName
  }
  if ($LASTEXITCODE -ne 0) { throw 'Inicio da API de teste falhou.' }
  $stage = 'Inicio do frontend 4174'
  Set-Content -LiteralPath $statusPath -Value $stage
  if (@($apps | Where-Object { $_.name -eq $webName }).Count -gt 0) {
    & $pm2Command restart $webName
  } else {
    if (Get-NetTCPConnection -State Listen -LocalPort 4174 -ErrorAction SilentlyContinue) { throw 'Porta 4174 ocupada. Nenhum processo sera encerrado.' }
    & $pm2Command serve $frontendDist 4174 --name $webName --spa
  }
  if ($LASTEXITCODE -ne 0) { throw 'Inicio do frontend de teste falhou.' }
  $stage = 'Verificacao HTTP da API e frontend'
  Set-Content -LiteralPath $statusPath -Value $stage
  $ready = $false
  for ($attempt = 0; $attempt -lt 10; $attempt++) {
    try {
      $health = Invoke-WebRequest http://127.0.0.1:4301/health -UseBasicParsing -TimeoutSec 3
      $web = Invoke-WebRequest http://127.0.0.1:4174 -UseBasicParsing -TimeoutSec 3
      if ($health.StatusCode -eq 200 -and $web.StatusCode -eq 200) { $ready = $true; break }
    } catch { Start-Sleep -Seconds 2 }
  }
  if (-not $ready) { throw 'Teste ainda nao respondeu. Confira os processos de teste no PM2; nao envie logs com credenciais.' }
  Set-Content -LiteralPath $statusPath -Value 'OK: API 4301 e frontend 4174 retornaram HTTP 200.'
  Write-Host 'Frontend: http://localhost:4174 ou http://192.168.0.69:4174'
  Write-Host 'API: http://192.168.0.69:4301/health'
  Write-Host 'Banco compartilhado com a versao publicada: operacoes de escrita afetam os mesmos dados.'
} finally {
  $env:PM2_HOME = $previousHome
  $env:PORT = $previousPort
  $env:NODE_ENV = $previousMode
}
