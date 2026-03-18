# Comandos Diarios de Operacao

Este guia padroniza a rotina diaria durante a semana de observacao (soak test).

## Pre-requisitos

- Abrir PowerShell como Administrador.
- Estar na raiz do projeto: C:\controle-estoque.

## 1) Checklist rapido da manha (2-3 minutos)

```powershell
Set-Location C:\controle-estoque\deploy\production\scripts
.\soak-status.ps1
```

O que validar:

- Tarefa ControleEstoqueStack em estado Ready.
- PM2 com 2 processos online:
  - controle-estoque-backend
  - controle-estoque-frontend
- Campo restarts sem crescimento inesperado desde o ultimo check.
- Sem erros novos em backend-error.log e frontend-error.log.

## 2) Smoke test funcional local

```powershell
# Backend
Invoke-WebRequest -Uri "http://localhost:4300/saude" -UseBasicParsing
Invoke-WebRequest -Uri "http://localhost:4300/api-docs" -UseBasicParsing

# Frontend
Invoke-WebRequest -Uri "http://localhost:4173" -UseBasicParsing
```

Resultado esperado:

- StatusCode 200 para os tres endpoints.

## 3) Verificacao de processos

```powershell
pm2 ls
pm2 jlist
```

Use para confirmar:

- status online
- uptime crescente
- restart_time estavel

## 4) Leitura de logs (ultimas linhas)

```powershell
Get-Content C:\controle-estoque\deploy\production\logs\backend.log -Tail 80
Get-Content C:\controle-estoque\deploy\production\logs\backend-error.log -Tail 80
Get-Content C:\controle-estoque\deploy\production\logs\frontend.log -Tail 80
Get-Content C:\controle-estoque\deploy\production\logs\frontend-error.log -Tail 80
```

## 5) Comandos de recuperacao rapida

### Reiniciar somente backend

```powershell
pm2 restart controle-estoque-backend
```

### Reiniciar somente frontend

```powershell
pm2 restart controle-estoque-frontend
```

### Reiniciar stack completa

```powershell
pm2 restart all
```

### Recarregar environment

```powershell
Set-Location C:\controle-estoque\deploy\production\scripts
pm2 startOrRestart .\ecosystem.config.cjs --update-env
pm2 save --force
```

## 6) Verificacao diaria do Agendador

```powershell
Get-ScheduledTask -TaskName "ControleEstoqueStack" | Select-Object TaskName,State,LastRunTime,LastTaskResult
```

Se LastTaskResult for diferente de 0, abrir o Historico da tarefa no Task Scheduler e investigar.

## 7) Evidencias para decisao de go-live

Salvar diariamente:

- Captura do pm2 ls
- Saida do soak-status.ps1
- Ultimas 80 linhas de backend-error.log e frontend-error.log
- Resultado do smoke test local

Ao final de 7 dias, usar o checklist em GO-LIVE-CHECKLIST.md.
