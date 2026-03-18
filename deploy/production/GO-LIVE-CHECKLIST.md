# Go-Live Checklist

Checklist para decisao de entrada em producao apos 7 dias de observacao local.

## 1) Criterios de estabilidade (obrigatorios)

- [ ] 7 dias consecutivos sem indisponibilidade.
- [ ] Processos PM2 online continuamente (backend e frontend).
- [ ] restart_time sem crescimento anormal.
- [ ] Nenhum erro recorrente em backend-error.log.
- [ ] Nenhum erro recorrente em frontend-error.log.
- [ ] Smoke test local aprovado diariamente (localhost:4300 e localhost:4173).

## 2) Validacao tecnica pre-go-live

- [ ] Backend compilado atualizado em deploy/production/backend/dist.
- [ ] Frontend build atualizado em deploy/production/frontend/dist.
- [ ] Configuracoes de ambiente revisadas e sem hardcode indevido.
- [ ] Backup dos arquivos de configuracao atual realizado.
- [ ] Plano de rollback validado e testado.

## 3) Infra e operacao

- [ ] Tarefa ControleEstoqueStack configurada e funcional no boot.
- [ ] PM2 com estado salvo (pm2 save --force).
- [ ] Monitoramento de logs definido (responsavel e horario).
- [ ] Responsavel de plantao na janela de virada.

## 4) Janela de virada (passo a passo)

1. Validar estado atual:

```powershell
Set-Location C:\controle-estoque\deploy\production\scripts
.\soak-status.ps1
pm2 ls
```

2. Executar smoke test final local:

```powershell
Invoke-WebRequest -Uri "http://localhost:4300/saude" -UseBasicParsing
Invoke-WebRequest -Uri "http://localhost:4173" -UseBasicParsing
```

3. Aplicar ajustes finais da topologia de producao (IIS/proxy/SSL), se aplicavel.

4. Validar endpoints de producao apos virada.

## 5) Checklist de rollback (se necessario)

- [ ] Comando de rollback documentado e testado.
- [ ] Ultimo build estavel identificado.
- [ ] Procedimento para retorno ao modo local definido.
- [ ] Contato dos responsaveis durante a janela.

## 6) Encerramento da virada

- [ ] Evidencias anexadas (logs, status PM2, endpoints).
- [ ] Registro de horario de inicio/fim.
- [ ] Aprovacao final registrada pelo responsavel tecnico.

## 7) Comandos uteis de emergencia

```powershell
pm2 restart all
pm2 logs --lines 200
Get-Content C:\controle-estoque\deploy\production\logs\backend-error.log -Tail 120
Get-Content C:\controle-estoque\deploy\production\logs\frontend-error.log -Tail 120
```
