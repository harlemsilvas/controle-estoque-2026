[CmdletBinding()]
param([string]$TaskName='ControleEstoqueStack',[string]$ApiHost='192.168.0.69')
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$runner = Join-Path $root 'atualizar-iniciar.ps1'
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
if (-not ([Security.Principal.WindowsPrincipal]::new($identity)).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'Execute como administrador.' }
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop
if ($TaskName -notlike 'ControleEstoque*') { throw 'Informe a tarefa de estoque existente.' }
if (-not (Test-Path -LiteralPath (Join-Path $root 'logs\startup\active-release.json'))) { throw 'Execute e valide atualizar-iniciar.ps1 antes de alterar a tarefa.' }
if ($ApiHost -notmatch '^[a-zA-Z0-9.-]+$') { throw 'Host invalido.' }
$state = Get-Content -LiteralPath (Join-Path $root 'logs\startup\active-release.json') -Raw | ConvertFrom-Json
if ($state.backendPort -ne 4300 -or $state.frontendPort -ne 4173) { throw 'A tarefa de producao exige release validado nas portas 4300/4173.' }
$ps = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$args = '-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "' + $runner + '" -ApiHost "' + $ApiHost + '" -Pm2Home "' + $state.pm2Home + '"'
$action = New-ScheduledTaskAction -Execute $ps -Argument $args -WorkingDirectory $root
# Preservar explicitamente os gatilhos, a conta e as demais configuracoes existentes.
Set-ScheduledTask -TaskName $task.TaskName -TaskPath $task.TaskPath -Action $action -ErrorAction Stop | Out-Null
Write-Host ('Acao atualizada na tarefa existente: ' + $task.TaskName + '. Gatilhos e conta preservados; nenhuma tarefa criada.')
