# Deploy de Producao

Esta pasta representa a estrutura que ficara em producao nesta maquina Windows.

## Estrutura

- `backend/` - artefatos compilados do backend
- `frontend/` - build estatico do frontend
- `config/` - exemplos de configuracao
- `logs/` - logs de runtime
- `scripts/` - scripts de build, start e inicializacao automatica

## Portas recomendadas

- Backend: `4300`
- Frontend: `4173`

## Preparar artefatos

No PowerShell:

```powershell
Set-Location C:\controle-estoque\deploy\production\scripts
.\prepare-deploy.ps1
```

## Iniciar manualmente

### Backend

```powershell
Set-Location C:\controle-estoque\deploy\production\scripts
.\start-backend.ps1
```

### Frontend

```powershell
Set-Location C:\controle-estoque\deploy\production\scripts
.\start-frontend.ps1
```

## Registrar na inicializacao do Windows

Executar PowerShell como administrador:

```powershell
Set-Location C:\controle-estoque\deploy\production\scripts
.\register-startup-tasks.ps1
```

Isso cria uma tarefa agendada unica (`ControleEstoqueStack`) para subir a stack no boot do Windows com delay de 90 segundos.

O bootstrap usa PM2 para backend e frontend com restart automatico em caso de falha.

## Revisao antes de ativar no boot

Antes de registrar as tarefas, revisar:

- `C:\controle-estoque\deploy\production\QUICK-VERIFY.md`
- `C:\controle-estoque\deploy\production\STARTUP-FLOWCHART.md`
- `C:\controle-estoque\deploy\production\PLANTAO-RAPIDO.md`
- `C:\controle-estoque\deploy\production\COMANDOS-DIARIOS.md`
- `C:\controle-estoque\deploy\production\GO-LIVE-CHECKLIST.md`
- `C:\controle-estoque\deploy\production\TEMPLATE-INCIDENTE.md`

Ordem recomendada:

1. `prepare-deploy.ps1`
2. `QUICK-VERIFY.md`
3. `register-startup-tasks.ps1` (Admin)
4. Reboot e smoke test em `http://localhost:4173`
