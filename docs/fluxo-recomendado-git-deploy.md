# Fluxo Recomendado (Git + Deploy)

Este guia documenta o fluxo oficial do projeto para evolucao de codigo, publicacao em producao e rollback seguro.

## Objetivo

- Usar `main` para desenvolvimento geral.
- Usar `deploy/production` para estado publicado/operacional.
- Manter rollback simples e rastreavel.

## Estrategia de Branches

- `main`: branch principal de desenvolvimento.
- `deploy/production`: branch de deploy para ambiente de producao.

Recomendacao:
- Desenvolva e valide em `main`.
- Promova para producao via merge de `main` em `deploy/production`.

## Fluxo Padrao de Publicacao

1. Atualizar local:

```bash
git checkout main
git pull
```

2. Trabalhar e commitar em `main`:

```bash
git add .
git commit -m "feat: descricao da entrega"
git push
```

3. Promover para `deploy/production`:

```bash
git checkout deploy/production
git pull
git merge main
git push
```

4. No servidor/ambiente, aplicar rotina de deploy (build/restart) conforme scripts de `deploy/production/scripts`.

## Rollback Seguro (Recomendado)

Use quando uma entrega em `deploy/production` precisa ser desfeita sem reescrever historico.

```bash
git checkout deploy/production
git pull
git revert HEAD
git push
```

Observacao:
- `git revert` cria um novo commit de reversao.
- Historico permanece integro para auditoria.

## Sincronizar Deploy com Main (Uso Pontual)

Use apenas quando necessario alinhar totalmente `deploy/production` com `main`.

```bash
git checkout deploy/production
git fetch origin
git reset --hard origin/main
git push --force-with-lease
```

Atencao:
- Esse fluxo reescreve historico remoto de `deploy/production`.
- Execute apenas com alinhamento do time.

## Hotfix em Producao

Se o ajuste for urgente em producao:

1. Corrigir em `deploy/production`.
2. Publicar rapidamente.
3. Levar o mesmo commit para `main`.

Exemplo:

```bash
# ja em deploy/production
git add .
git commit -m "hotfix: corrige erro critico"
git push

# levar para main
git checkout main
git pull
git cherry-pick <hash_do_hotfix>
git push
```

## Convencao de Commits (Sugestao)

- `feat:` nova funcionalidade
- `fix:` correcao de bug
- `hotfix:` correcao urgente em producao
- `chore:` manutencao/infra
- `docs:` documentacao

## Checklist Rapido antes do Push em deploy/production

- Build backend ok.
- Build frontend ok.
- CORS valido para origem esperada.
- API base URL de producao correta.
- Portas/firewall validados (4173 frontend, 4300 API).
- Teste funcional minimo: login + tela principal.

## Tags de Release (Opcional, recomendado)

Para facilitar rollback por versao:

```bash
git checkout deploy/production
git pull
git tag -a v2026.03.17-01 -m "release producao"
git push origin v2026.03.17-01
```

Rollback para tag:

```bash
git checkout deploy/production
git reset --hard v2026.03.17-01
git push --force-with-lease
```

## Comandos de Consulta Rapida

```bash
git branch -vv
git log --oneline --decorate -n 10
git status -sb
```

---

Ultima atualizacao: 2026-03-17
