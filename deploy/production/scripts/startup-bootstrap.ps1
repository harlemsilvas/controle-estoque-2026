param([switch]$SemAtualizacao)
$ErrorActionPreference='Stop'
$repoRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..'))
& (Join-Path $repoRoot 'atualizar-iniciar.ps1') -Pm2Home (Join-Path $repoRoot 'deploy\production\.pm2') -SemAtualizacao:$SemAtualizacao
