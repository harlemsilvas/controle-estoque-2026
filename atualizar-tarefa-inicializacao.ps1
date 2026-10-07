[CmdletBinding()]
param([string]$TaskName='ControleEstoqueStack',[string]$ApiHost='192.168.0.69')
$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$identity=[Security.Principal.WindowsIdentity]::GetCurrent()
if(-not([Security.Principal.WindowsPrincipal]::new($identity)).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){throw 'Execute como administrador.'}
$task=Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop
if($TaskName -notlike 'ControleEstoque*'){throw 'Tarefa inesperada.'}
$stateFile=Join-Path $root 'logs\startup\active-release.json'
if(-not(Test-Path -LiteralPath $stateFile)){throw 'Validar release antes de ativar o boot.'}
$state=Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
if($state.backendPort -ne 4300 -or $state.frontendPort -ne 4173){throw 'Release deve usar 4300/4173.'}
if($ApiHost -notmatch '^[a-zA-Z0-9.-]+$'){throw 'Host invalido.'}
$actions=@($task.Actions)
if($actions.Count -ne 1){throw 'Revisar tarefa com multiplas acoes.'}
$match=[regex]::Match($actions[0].Arguments,'(?i)-File\s+"([^"]+)"')
if(-not $match.Success){throw 'Roteiro da tarefa nao reconhecido.'}
$bootstrap=[IO.Path]::GetFullPath($match.Groups[1].Value)
$allowed=@((Join-Path $root 'deploy\production\scripts\startup-bootstrap.ps1'),'C:\controle-estoque\deploy\production\scripts\startup-bootstrap.ps1')
if($bootstrap -notin $allowed -or -not(Test-Path -LiteralPath $bootstrap)){throw 'Caminho da tarefa inesperado.'}
$backup=$bootstrap+'.before-automation.bak'
if(-not(Test-Path -LiteralPath $backup)){Copy-Item -LiteralPath $bootstrap -Destination $backup}
# Atualizar o roteiro ja chamado pela tarefa: preservar inclusive sua senha Windows armazenada.
$runner=(Join-Path $root 'atualizar-iniciar.ps1').Replace("'","''")
$home=([string]$state.pm2Home).Replace("'","''")
$delegate="param([switch]`$SemAtualizacao)`n`$ErrorActionPreference='Stop'`n& '$runner' -ApiHost '$ApiHost' -Pm2Home '$home' -SemAtualizacao:`$SemAtualizacao`n"
Set-Content -LiteralPath $bootstrap -Value $delegate -Encoding utf8
Write-Host ('Roteiro da tarefa existente atualizado: '+$TaskName+'. Conta, senha armazenada, gatilhos e acao preservados.')
