$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$bootstrapScript = Join-Path $scriptDir 'startup-bootstrap.ps1'
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero)

$startupTrigger = New-ScheduledTaskTrigger -AtStartup
$startupTrigger.Delay = 'PT90S'

$startupAction = New-ScheduledTaskAction -Execute 'powershell.exe' -WorkingDirectory $scriptDir -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$bootstrapScript`""

$stackTaskName = 'ControleEstoqueStack'

# Legacy tasks from previous setup
$legacyTaskNames = @(
	'ControleEstoqueBackend',
	'ControleEstoqueFrontend'
)

foreach ($legacyTask in $legacyTaskNames) {
	Unregister-ScheduledTask -TaskName $legacyTask -Confirm:$false -ErrorAction SilentlyContinue
}

Unregister-ScheduledTask -TaskName $stackTaskName -Confirm:$false -ErrorAction SilentlyContinue

Register-ScheduledTask -TaskName $stackTaskName -Action $startupAction -Trigger $startupTrigger -Principal $principal -Settings $settings -Force -ErrorAction Stop | Out-Null

Get-ScheduledTask -TaskName $stackTaskName -ErrorAction Stop | Out-Null

Write-Host 'Tarefa de inicializacao registrada com sucesso (delay de 90s): ControleEstoqueStack'
