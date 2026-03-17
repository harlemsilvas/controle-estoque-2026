# Producao no Windows

## Objetivo

Colocar o projeto em operacao de forma estavel no Windows, com inicializacao automatica apos boot do sistema e com separacao clara entre build, execucao e monitoramento.

## Estado atual do projeto

### Backend

- O backend compila em `back-end/dist`.
- O backend de producao deve subir em Node.js na porta `4300`.
- Ja existe um script para liberar a porta antes de subir:
  - `back-end/scripts/free-port.js`
  - `npm run free-port`

### Frontend

- O frontend usa Vite e gera build em `front-end/dist`.
- O frontend agora usa helper central para a base da API e suporta `VITE_API_BASE_URL`.
- Em producao com IIS/proxy HTTPS, o frontend deve usar a mesma origem do site, sem host absoluto em HTTP.
- Existe uma pasta materializada de deploy em `deploy/production`.

## Bloqueios atuais para producao

### 1. URLs hardcoded residuais no frontend

Situacao atual:

- Os pontos ativos principais foram migrados para helper central.
- Restam apenas comentarios antigos e arquivos de copia/backup que nao fazem parte do runtime principal.

Impacto:

- Dificulta trocar IP, porta ou dominio.
- Obriga rebuild manual sempre que o endereco do backend mudar.
- Aumenta risco de erro ao mover para outra maquina.

### 2. Frontend e backend ainda nao estao totalmente padronizados para um runtime unico

Hoje existem dois caminhos possiveis de producao:

1. Modelo minimo e rapido:
- Backend sobe em Node.js na porta `4300`.
- Frontend sobe como site estatico em outra porta, por exemplo `4173`.

2. Modelo ideal:
- Backend exposto no mesmo host via reverse proxy.
- Frontend servido no mesmo host e mesma porta publica, evitando CORS e mixed content.

No estado atual, o modelo minimo e o mais seguro para colocar em producao sem refactor amplo.

## Arquitetura recomendada para a primeira versao de producao

### Recomendacao pratica

Usar dois processos no Windows:

1. Backend
- Diretorio final de deploy: `deploy/production/backend`
- Processo: `node dist/app.js`
- Porta: `4300`

2. Frontend estatico
- Diretorio final de deploy: `deploy/production/frontend`
- Artefato: `dist`
- Porta sugerida: `4173`
- Servidor estatico incluido: `deploy/production/scripts/serve-frontend.js`

### Motivo da recomendacao

- Menor risco de quebrar as rotas atuais.
- Evita refactor imediato de todas as chamadas da API.
- Permite iniciar producao rapidamente.
- Facilita rollback.

## Inicializacao automatica no Windows

Para este rollout, a opcao adotada e o Agendador de Tarefas do Windows com conta `SYSTEM`.

Fluxo padrao:

1. Executar `deploy/production/scripts/register-startup-tasks.ps1` como administrador.
2. O script registra duas tarefas de boot:
- `ControleEstoqueBackend` -> executa `start-backend.ps1`
- `ControleEstoqueFrontend` -> executa `start-frontend.ps1`
3. Cada script libera porta e sobe processo em background com logs em `deploy/production/logs`.

Documentos de apoio para revisao antes da ativacao:

- `deploy/production/STARTUP-FLOWCHART.md`
- `deploy/production/QUICK-VERIFY.md`

## Processo recomendado de publicacao

### Backend

1. Abrir terminal em `deploy/production/scripts`
2. Executar `./prepare-deploy.ps1`
3. Validar se `deploy/production/backend/dist/app.js` foi gerado
4. Validar conectividade com banco

### Frontend

1. Executar `./prepare-deploy.ps1`
2. Validar se `deploy/production/frontend/dist/index.html` foi gerado

## Variaveis de ambiente recomendadas

### Backend

Criar um `.env` de producao com pelo menos:

```env
PORT=4300
NODE_ENV=production
DB_SERVER=SEU_SERVIDOR
DB_DATABASE=SEU_BANCO
DB_USER=SEU_USUARIO
DB_PASSWORD=SUA_SENHA
DB_PORT=1433
```

### Frontend

Para producao com HTTPS publicado no IIS, padronizar:

```env
VITE_API_BASE_URL=
```

Observacao:

- Valor vazio faz o frontend usar a mesma origem do navegador.
- Isso evita mixed content quando o site esta em `https://...` e o backend esta por tras de proxy interno.

## Checklist de validacao antes de subir como servico

- `npm run build` em `back-end` concluido sem erro
- `npm run build` em `front-end` concluido sem erro
- Banco de dados acessivel a partir da maquina Windows
- Porta `4300` liberada para backend
- Porta `4173` ou porta escolhida liberada para frontend
- Firewall configurado
- `.env` de producao criado
- Validacao manual das rotas principais concluida
- Swagger e login testados
- Tela de estoque e movimentacao testadas

## Roteiro de operacao diaria

### Reiniciar backend manualmente

```powershell
Set-Location C:\controle-estoque\deploy\production\scripts
.\start-backend.ps1
```

### Regerar frontend de producao

```powershell
Set-Location C:\controle-estoque\deploy\production\scripts
.\prepare-deploy.ps1
```

### Verificar status das tarefas agendadas

```powershell
Get-ScheduledTask -TaskName "ControleEstoque*" | Format-Table TaskName, State
```

## Recomendacao de logs

Separar logs por processo:

- backend.log
- frontend.log
- erros-backend.log
- erros-frontend.log

No fluxo com Task Scheduler, manter redirecionamento de stdout e stderr nos scripts `start-backend.ps1` e `start-frontend.ps1`.

## Proxima evolucao arquitetural recomendada

Depois da primeira entrada em producao:

1. Mover API para prefixo `/api`
2. Remover URLs hardcoded do frontend
3. Passar frontend para mesma origem do backend ou reverse proxy
4. Consolidar para um unico endpoint publico
5. Adicionar HTTPS e rotacao de logs

## Status desta etapa

- Limpeza de `localhost` residual concluida em comentarios/backup do frontend runtime.
- Fluxo de startup agendado revisado com checklist pre-boot.
- Proximo passo operacional: executar `register-startup-tasks.ps1` como administrador e validar reboot.
