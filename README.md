# Controle Estoque 2026

Sistema de gestao de estoque com front-end em React/Vite e back-end em Node.js/Express + SQL Server.

## Estrutura do Projeto

- [back-end](back-end): API, autenticacao, regras de negocio e acesso ao banco.
- [front-end](front-end): aplicacao web React.
- [deploy/production](deploy/production): scripts e estrutura de publicacao para Windows.
- [docs](docs): documentacoes de operacao, deploy e fluxo Git.

## Tecnologias

- Back-end: Node.js, Express, TypeScript, MSSQL, JWT.
- Front-end: React, Vite, Axios, React Router.
- Operacao: PowerShell, Task Scheduler (Windows), scripts de deploy.

## Requisitos

- Node.js 20+ (recomendado)
- npm 10+
- SQL Server acessivel
- Windows (para fluxo de deploy automatizado com Task Scheduler)

## Rodando em Desenvolvimento

### 1) Back-end

```bash
cd back-end
npm install
npm run build
npm start
```

API padrao: `http://localhost:4300`

### 2) Front-end

```bash
cd front-end
npm install
npm run dev
```

App local (dev): `http://localhost:5173`

## Build de Producao

### Back-end

```bash
cd back-end
npm run build
```

### Front-end

```bash
cd front-end
npm run build
```

## Deploy Windows (Resumo)

Scripts principais em [deploy/production/scripts](deploy/production/scripts):

- `prepare-deploy.ps1`: prepara artefatos de deploy.
- `start-backend.ps1`: sobe API na porta 4300.
- `start-frontend.ps1`: sobe frontend na porta 4173.
- `register-startup-tasks.ps1`: registra inicializacao automatica no boot.

Guia completo:
- [docs/producao-windows.md](docs/producao-windows.md)
- [deploy/production/README.md](deploy/production/README.md)

## Fluxo Git Recomendado

- `main`: desenvolvimento geral.
- `deploy/production`: branch de publicacao/operacao.

Guia completo:
- [docs/fluxo-recomendado-git-deploy.md](docs/fluxo-recomendado-git-deploy.md)
- [docs/runbook-operacional.md](docs/runbook-operacional.md)

## Portas e Rede

- Front-end: 4173
- API: 4300

Em acesso LAN, ajuste de CORS e firewall deve estar habilitado para as portas acima.

## Observacoes

- Arquivos sensiveis (`.env`, logs, dist de deploy) estao protegidos por regras de ignore.
- Em producao, prefira sempre rollback com `git revert` na branch `deploy/production`.

---

Ultima atualizacao: 2026-03-17
