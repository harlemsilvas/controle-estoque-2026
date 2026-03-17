# Runbook Operacional (1 Pagina)

Guia rapido para operacao diaria, deploy e rollback.

## 1) Fluxo Diario de Desenvolvimento

```bash
git checkout main
git pull
# ...alteracoes...
git add .
git commit -m "feat|fix|chore: descricao"
git push
```

## 2) Promocao para Producao

```bash
git checkout deploy/production
git pull
git merge main
git push
```

## 3) Deploy Tecnico no Servidor Windows

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
& "C:\controle-estoque\deploy\production\scripts\prepare-deploy.ps1"
& "C:\controle-estoque\deploy\production\scripts\register-startup-tasks.ps1"
```

## 4) Validacao Rapida Pos-Deploy

```powershell
netstat -ano -p tcp | findstr :4300
netstat -ano -p tcp | findstr :4173
curl.exe -s -o NUL -w "BACKEND_HTTP:%{http_code}\n" -X OPTIONS -H "Origin: http://localhost:4173" http://localhost:4300/login
curl.exe -s -o NUL -w "FRONTEND_HTTP:%{http_code}\n" http://localhost:4173/
```

Esperado:
- 4300 em LISTENING
- 4173 em LISTENING
- BACKEND_HTTP:204 (preflight)
- FRONTEND_HTTP:200

## 5) Rollback Seguro (Recomendado)

```bash
git checkout deploy/production
git pull
git revert HEAD
git push
```

## 6) Hotfix Urgente em Producao

```bash
# em deploy/production
git add .
git commit -m "hotfix: descricao"
git push

# sincronizar com main
git checkout main
git pull
git cherry-pick <hash_do_hotfix>
git push
```

## 7) Comandos de Diagnostico

```bash
git branch -vv
git status -sb
git log --oneline --decorate -n 10
```

## 8) Referencias

- [README.md](../README.md)
- [docs/fluxo-recomendado-git-deploy.md](fluxo-recomendado-git-deploy.md)
- [docs/producao-windows.md](producao-windows.md)
- [deploy/production/README.md](../deploy/production/README.md)

---

Ultima atualizacao: 2026-03-17
