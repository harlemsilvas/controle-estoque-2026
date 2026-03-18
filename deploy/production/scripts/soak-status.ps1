$ErrorActionPreference = 'Continue'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$deployRoot = Split-Path -Parent $scriptDir
$logsDir = Join-Path $deployRoot 'logs'
$pm2Home = Join-Path $deployRoot '.pm2'

$env:PM2_HOME = $pm2Home

Write-Host '=== Scheduled Task ===' -ForegroundColor Cyan
Get-ScheduledTask -TaskName 'ControleEstoqueStack' -ErrorAction SilentlyContinue |
  Select-Object TaskName, State, LastRunTime, LastTaskResult |
  Format-Table -AutoSize

Write-Host "`n=== PM2 Process List ===" -ForegroundColor Cyan
$pm2Cmd = Get-Command pm2 -ErrorAction SilentlyContinue
if ($pm2Cmd) {
  & $pm2Cmd.Path ls

  Write-Host "`n=== PM2 Restart Counters ===" -ForegroundColor Cyan
  $json = & $pm2Cmd.Path jlist 2>$null
  if ($json) {
    $apps = $json | ConvertFrom-Json
    $apps | Select-Object @{Name='name';Expression={$_.name}}, @{Name='status';Expression={$_.pm2_env.status}}, @{Name='restarts';Expression={$_.pm2_env.restart_time}}, @{Name='uptime';Expression={
      if ($_.pm2_env.pm_uptime) {
        [DateTimeOffset]::FromUnixTimeMilliseconds([Int64]$_.pm2_env.pm_uptime).LocalDateTime
      }
      else {
        $null
      }
    }} | Format-Table -AutoSize
  }
}
else {
  Write-Warning 'PM2 nao encontrado no PATH.'
}

Write-Host "`n=== Recent Logs (tail 40) ===" -ForegroundColor Cyan
$files = @(
  'backend.log',
  'backend-error.log',
  'frontend.log',
  'frontend-error.log'
)

foreach ($name in $files) {
  $path = Join-Path $logsDir $name
  if (Test-Path $path) {
    Write-Host "`n--- $name ---" -ForegroundColor Yellow
    Get-Content -Path $path -Tail 40
  }
}
