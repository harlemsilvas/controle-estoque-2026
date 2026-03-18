# Template de Registro de Incidente

Use este modelo para registrar qualquer indisponibilidade, erro recorrente ou degradação durante a semana de observacao e no pos go-live.

## 1) Identificacao

- ID do incidente:
- Data:
- Hora de inicio:
- Hora de fim:
- Duracao total:
- Responsavel pelo atendimento:
- Severidade (Baixa/Media/Alta/Critica):

## 2) Impacto

- Servico afetado (backend/frontend/ambos):
- Sintoma observado:
- Usuarios afetados:
- Escopo (local/rede/total):
- Impacto no negocio:

## 3) Evidencias iniciais

### 3.1 Status da tarefa de inicializacao

```powershell
Get-ScheduledTask -TaskName "ControleEstoqueStack" | Select-Object TaskName,State,LastRunTime,LastTaskResult
```

- Resultado resumido:

### 3.2 Status PM2

```powershell
pm2 ls
pm2 jlist
```

- Resultado resumido:

### 3.3 Smoke test

```powershell
Invoke-WebRequest -Uri "http://localhost:4300/saude" -UseBasicParsing
Invoke-WebRequest -Uri "http://localhost:4173" -UseBasicParsing
```

- Resultado resumido:

### 3.4 Logs

```powershell
Get-Content C:\controle-estoque\deploy\production\logs\backend-error.log -Tail 120
Get-Content C:\controle-estoque\deploy\production\logs\frontend-error.log -Tail 120
```

- Trechos relevantes:

## 4) Linha do tempo

- hh:mm - evento 1
- hh:mm - evento 2
- hh:mm - evento 3

## 5) Causa

- Causa raiz confirmada:
- Causa contribuinte:
- Hipotese inicial estava correta? (sim/nao):

## 6) Acao de contencao

- Acao aplicada:
- Comando executado:
- Hora da acao:
- Resultado apos acao:

## 7) Correcao definitiva

- Mudanca definitiva aplicada:
- Arquivos alterados:
- Pull request/commit:
- Risco residual:

## 8) Validacao pos-recuperacao

- [ ] Backend 200 em /saude
- [ ] Frontend 200 em / (4173)
- [ ] PM2 com apps online
- [ ] restart_time estabilizado
- [ ] Sem erro recorrente nos logs apos 15 minutos

## 9) Plano preventivo

- Acao 1:
- Acao 2:
- Acao 3:
- Responsavel:
- Prazo:

## 10) Encerramento

- Incidente encerrado por:
- Data/hora de encerramento:
- Aprovacao tecnica:
- Observacoes finais:

---

## Versao curta (para chat interno)

- ID:
- Inicio:
- Fim:
- Impacto:
- Causa:
- Acao:
- Status atual:
- Proximo passo:
