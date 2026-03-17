# Plano de Rollout para Producao

## Meta

Publicar o sistema em Windows com inicializacao automatica e com risco controlado.

## Estrategia

A publicacao sera feita em duas fases.

### Fase 1. Producao operacional minima

Objetivo:
- Colocar o sistema no ar com estabilidade.
- Subir backend e frontend automaticamente no boot do Windows.
- Evitar refactor grande antes do primeiro deploy.

Escopo:
- Build do backend
- Build do frontend
- Servico do backend no Windows
- Servico do frontend estatico no Windows
- Documentacao de operacao
- Checklist de validacao
- Pasta de deploy padrao em `deploy/production`

Nao entra nesta fase:
- Migracao total para `/api`
- Runtime unico backend + frontend
- HTTPS com proxy reverso
- Observabilidade avancada

### Fase 2. Endurecimento de producao

Objetivo:
- Melhorar arquitetura, manutencao e seguranca.

Escopo:
- Concluir padronizacao de todas as chamadas da API
- Eliminar `localhost` hardcoded do frontend
- Introduzir prefixo `/api`
- Consolidar publicacao em um endpoint unico
- Definir HTTPS
- Melhorar logs e recuperacao automatica

## Plano de execucao

### Etapa 1. Preparacao tecnica

Responsavel:
- Desenvolvimento

Atividades:
- Revisar apenas URLs residuais e arquivos de backup/comentario no frontend
- Fechar configuracao de `.env` do backend
- Confirmar build de frontend e backend
- Confirmar portas de producao `4300` e `4173`

Criterio de saida:
- Build de ambos sem erro
- Banco acessivel
- Rota de login funcionando

### Etapa 2. Empacotamento de producao

Responsavel:
- Desenvolvimento

Atividades:
- Gerar `back-end/dist`
- Gerar `front-end/dist`
- Copiar artefatos para `deploy/production`
- Validar artefatos na maquina de producao

Criterio de saida:
- `deploy/production/backend/dist/app.js` operacional
- `deploy/production/frontend/dist/index.html` operacional

### Etapa 3. Inicializacao automatica no Windows

Responsavel:
- Infra ou Desenvolvimento

Atividades:
- Registrar tarefas `ControleEstoqueBackend` e `ControleEstoqueFrontend` via `register-startup-tasks.ps1`
- Revisar checklist pre-ativacao em `deploy/production/QUICK-VERIFY.md`
- Revisar fluxo completo em `deploy/production/STARTUP-FLOWCHART.md`
- Configurar e validar logs de saida e erro

Criterio de saida:
- Reiniciar Windows e confirmar que ambos sobem sozinhos

### Etapa 4. Teste de fumaca

Responsavel:
- Desenvolvimento ou Operacao

Atividades:
- Abrir frontend
- Testar login
- Consultar produtos
- Consultar dashboard
- Registrar movimentacao de estoque
- Validar alertas

Criterio de saida:
- Fluxos criticos funcionando sem erro 500

### Etapa 5. Go-live controlado

Responsavel:
- Desenvolvimento

Atividades:
- Liberar acesso para usuarios
- Monitorar logs por 1 dia util
- Corrigir desvios pequenos sem alterar arquitetura

Criterio de saida:
- Sistema estavel apos primeiro dia de uso

## Riscos conhecidos

### Risco 1. URLs hardcoded no frontend

Probabilidade:
- Baixa

Impacto:
- Alto

Mitigacao:
- Concluir limpeza de comentarios e arquivos de copia fora do runtime principal

### Risco 2. Porta ocupada no backend

Probabilidade:
- Media

Impacto:
- Medio

Mitigacao:
- Usar `npm run free-port` antes do start
- Garantir um unico servico do backend no Windows

### Risco 3. Processo sobe mas banco nao conecta

Probabilidade:
- Media

Impacto:
- Alto

Mitigacao:
- Validar credenciais e conectividade antes do go-live
- Testar com a base real ou homologacao equivalente

### Risco 4. Frontend subir com build antigo

Probabilidade:
- Media

Impacto:
- Medio

Mitigacao:
- Padronizar passo de build antes de copiar artefatos
- Registrar data e versao do deploy

## Indicadores de aceite

- Backend responde em `http://HOST:4300`
- Frontend responde em `http://HOST:4173` ou porta definida
- Login funciona
- Dashboard carrega
- Consulta de produtos funciona
- Movimentacao de estoque funciona
- Reinicio do Windows nao exige intervencao manual

## Ordem recomendada de implantacao

1. Corrigir parametrizacao de URLs do frontend
2. Executar `deploy/production/scripts/prepare-deploy.ps1`
3. Executar checklist de `deploy/production/QUICK-VERIFY.md`
4. Registrar tarefas no boot com `deploy/production/scripts/register-startup-tasks.ps1`
5. Reiniciar Windows e validar startup automatico
6. Executar smoke test
7. Publicar para usuarios

## Entregaveis desta etapa

- Documento de producao para Windows
- Plano de rollout
- Script de liberacao de porta do backend
- Fluxo detalhado de startup (`deploy/production/STARTUP-FLOWCHART.md`)
- Checklist rapido pre-ativacao (`deploy/production/QUICK-VERIFY.md`)

## Proximos entregaveis sugeridos

- Guia de instalacao por NSSM
- Padronizacao de `.env.production`
- Refactor da base URL do frontend
- Prefixo `/api` no backend
