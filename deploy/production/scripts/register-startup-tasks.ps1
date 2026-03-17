$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendScript = Join-Path $scriptDir 'start-backend.ps1'
$frontendScript = Join-Path $scriptDir 'start-frontend.ps1'
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero)

$backendTrigger = New-ScheduledTaskTrigger -AtStartup
$backendTrigger.Delay = 'PT20S'
$frontendTrigger = New-ScheduledTaskTrigger -AtStartup
$frontendTrigger.Delay = 'PT35S'

$backendAction = New-ScheduledTaskAction -Execute 'powershell.exe' -WorkingDirectory $scriptDir -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$backendScript`""
$frontendAction = New-ScheduledTaskAction -Execute 'powershell.exe' -WorkingDirectory $scriptDir -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$frontendScript`""

$backendTaskName = 'ControleEstoqueBackend'
$frontendTaskName = 'ControleEstoqueFrontend'

Unregister-ScheduledTask -TaskName $backendTaskName -Confirm:$false -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName $frontendTaskName -Confirm:$false -ErrorAction SilentlyContinue

Register-ScheduledTask -TaskName $backendTaskName -Action $backendAction -Trigger $backendTrigger -Principal $principal -Settings $settings -Force -ErrorAction Stop | Out-Null
Register-ScheduledTask -TaskName $frontendTaskName -Action $frontendAction -Trigger $frontendTrigger -Principal $principal -Settings $settings -Force -ErrorAction Stop | Out-Null

Get-ScheduledTask -TaskName $backendTaskName -ErrorAction Stop | Out-Null
Get-ScheduledTask -TaskName $frontendTaskName -ErrorAction Stop | Out-Null

Write-Host 'Tarefas de inicializacao registradas com sucesso.'
