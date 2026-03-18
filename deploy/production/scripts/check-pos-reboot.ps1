param(
    [string]$LogDir,
    [switch]$NoLog
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$deployRoot = Split-Path -Parent $scriptDir
$env:PM2_HOME = Join-Path $deployRoot '.pm2'

if ([string]::IsNullOrWhiteSpace($LogDir)) {
    $LogDir = Join-Path $deployRoot 'logs'
}

New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logFilePath = Join-Path $LogDir "check-pos-reboot-$timestamp.log"

function Write-CheckLine {
    param(
        [string]$Message,
        [ConsoleColor]$Color = [ConsoleColor]::Gray
    )

    if ($null -eq $Message) {
        $Message = ''
    }

    Write-Host $Message -ForegroundColor $Color
    if (-not $NoLog) {
        Add-Content -Path $logFilePath -Value $Message
    }
}

$approved = 0
$rejected = 0

function Add-Approved {
    param([string]$Message)
    Write-CheckLine -Message "[APROVADO] $Message" -Color Green
    $script:approved++
}

function Add-Rejected {
    param([string]$Message)
    Write-CheckLine -Message "[REPROVADO] $Message" -Color Red
    $script:rejected++
}

function Test-Http200 {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Url
    )

    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Add-Approved "$Url retornou HTTP 200"
            return $true
        }

        Add-Rejected "$Url retornou HTTP $($response.StatusCode)"
        return $false
    }
    catch {
        Add-Rejected "$Url falhou: $($_.Exception.Message)"
        return $false
    }
}

function Test-Pm2AppOnline {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Pm2Path,
        [Parameter(Mandatory = $true)]
        [string]$AppName
    )

    $output = & $Pm2Path describe $AppName --no-color 2>&1 | Out-String
    $exitCode = $LASTEXITCODE

    if ($exitCode -ne 0) {
        if ($output -match "doesn't exist|not found|unknown") {
            Add-Rejected "App PM2 $AppName nao encontrada"
            return
        }

        Add-Rejected "Falha ao consultar app PM2 $AppName"
        return
    }

    $statusLine = ($output -split "`r?`n") | Where-Object {
        $_ -match '(?i)status' -and $_ -match '(?i)online|stopped|errored|launching|waiting'
    } | Select-Object -First 1

    if ($null -eq $statusLine) {
        Add-Rejected "Nao foi possivel identificar status da app PM2 $AppName"
        return
    }

    if ($statusLine -match '(?i)online') {
        Add-Approved "PM2 $AppName online"
        return
    }

    Add-Rejected "PM2 $AppName nao esta online"
}

Write-CheckLine -Message '=== CHECK POS REBOOT - CONTROLE ESTOQUE ===' -Color Cyan
Write-CheckLine -Message "PM2_HOME: $env:PM2_HOME"
if (-not $NoLog) {
    Write-CheckLine -Message "LOG_FILE: $logFilePath"
}
Write-CheckLine -Message ''

# 1) Scheduled task
$task = Get-ScheduledTask -TaskName 'ControleEstoqueStack' -ErrorAction SilentlyContinue
if ($null -eq $task) {
    Add-Rejected 'Tarefa ControleEstoqueStack nao encontrada'
}
else {
    $taskInfo = Get-ScheduledTaskInfo -TaskName 'ControleEstoqueStack' -ErrorAction SilentlyContinue
    if ($task.State -eq 'Ready') {
        Add-Approved 'Tarefa ControleEstoqueStack em estado Ready'
    }
    else {
        Add-Rejected "Tarefa ControleEstoqueStack em estado $($task.State)"
    }

    if ($taskInfo -and $taskInfo.LastTaskResult -eq 0) {
        Add-Approved 'LastTaskResult da tarefa igual a 0'
    }
    elseif ($taskInfo) {
        Add-Rejected "LastTaskResult da tarefa diferente de 0: $($taskInfo.LastTaskResult)"
    }
    else {
        Add-Rejected 'Nao foi possivel ler LastTaskResult da tarefa'
    }
}

# 2) PM2 status
$pm2Cmd = Get-Command pm2 -ErrorAction SilentlyContinue
if ($null -eq $pm2Cmd) {
    Add-Rejected 'PM2 nao encontrado no PATH'
}
else {
    try {
        Test-Pm2AppOnline -Pm2Path $pm2Cmd.Path -AppName 'controle-estoque-backend'
        Test-Pm2AppOnline -Pm2Path $pm2Cmd.Path -AppName 'controle-estoque-frontend'
    }
    catch {
        Add-Rejected "Falha ao consultar PM2: $($_.Exception.Message)"
    }
}

# 3) HTTP checks
Test-Http200 -Url 'http://localhost:4300/health' | Out-Null
Test-Http200 -Url 'http://localhost:4300/saude' | Out-Null
Test-Http200 -Url 'http://localhost:4173' | Out-Null

Write-CheckLine -Message ''
Write-CheckLine -Message '=== RESUMO ===' -Color Cyan
Write-CheckLine -Message "Aprovados: $approved"
Write-CheckLine -Message "Reprovados: $rejected"

if ($rejected -eq 0) {
    Write-CheckLine -Message 'RESULTADO FINAL: APROVADO' -Color Green
    exit 0
}

Write-CheckLine -Message 'RESULTADO FINAL: REPROVADO' -Color Red
exit 1
