# Plantao Rapido (Incidente)

Guia de 1 pagina para resposta rapida quando houver queda, erro 500, CORS ou indisponibilidade.

## 0) Contexto padrao

- Backend: http://localhost:4300
- Frontend: http://localhost:4173
- Task boot: ControleEstoqueStack
- PM2 apps:
  - controle-estoque-backend
  - controle-estoque-frontend

## 1) Triagem em 60 segundos

```powershell
Set-Location C:\controle-estoque\deploy\production\scripts
.\soak-status.ps1
```

Conferir imediatamente:

- Task ControleEstoqueStack em Ready/Running.
- PM2 com 2 processos online.
- restart_time aumentou desde a ultima leitura.
- Ultimas linhas de backend-error.log e frontend-error.log.

## 2) Smoke test minimo

```powershell
Invoke-WebRequest -Uri "http://localhost:4300/saude" -UseBasicParsing
Invoke-WebRequest -Uri "http://localhost:4173" -UseBasicParsing
```

Esperado: StatusCode 200 em ambos.

## 3) Acoes de recuperacao rapida

### 3.1 Reiniciar apenas backend

```powershell
pm2 restart controle-estoque-backend
```

### 3.2 Reiniciar apenas frontend

```powershell
pm2 restart controle-estoque-frontend
```

### 3.3 Reiniciar tudo

```powershell
pm2 restart all
```

### 3.4 Reaplicar ecosystem (env + processos)

```powershell
Set-Location C:\controle-estoque\deploy\production\scripts
pm2 startOrRestart .\ecosystem.config.cjs --update-env
pm2 save --force
```

## 4) Se PM2 nao responder

```powershell
Set-Location C:\controle-estoque\deploy\production\scripts
.\start-backend.ps1
.\start-frontend.ps1
```

Depois retomar PM2 assim que possivel.

## 5) Coleta minima de evidencias

```powershell
pm2 ls
pm2 logs --lines 150
Get-Content C:\controle-estoque\deploy\production\logs\backend-error.log -Tail 120
Get-Content C:\controle-estoque\deploy\production\logs\frontend-error.log -Tail 120
Get-ScheduledTask -TaskName "ControleEstoqueStack" | Select-Object TaskName,State,LastRunTime,LastTaskResult
```

Registrar:

- horario da falha
- impacto percebido
- acao aplicada
- horario da recuperacao
- se houve recorrencia

## 6) Escalada

Escalar quando ocorrer qualquer condicao abaixo:

- reinicio nao normaliza em ate 10 minutos
- restart_time cresce continuamente
- erro 500 recorrente no backend
- frontend sobe, mas API continua indisponivel
- LastTaskResult da tarefa diferente de 0 apos reboot

## 7) Encerramento do incidente

- Confirmar acesso em localhost:4173.
- Confirmar saude em localhost:4300/saude.
- Rodar novamente soak-status.ps1.
- Anexar evidencias no registro operacional.
