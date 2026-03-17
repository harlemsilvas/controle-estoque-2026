# Fluxo de Startup Agendado - Verificação Pré-Ativação

## 📋 Resumo Executivo

Este documento descreve o fluxo completo de inicialização automática do Controle de Estoque via Windows Task Scheduler. Revise cada seção antes de ativar em produção.

---

## 🔄 Fluxo de Inicialização

```
Windows Boot
    ↓
Task Scheduler dispara @ Startup
    ├─→ Task 1: ControleEstoqueBackend
    │   └─→ register-startup-tasks.ps1 define
    │       └─→ start-backend.ps1 (PowerShell)
    │
    └─→ Task 2: ControleEstoqueFrontend
        └─→ register-startup-tasks.ps1 define
            └─→ start-frontend.ps1 (PowerShell)

Execução esperada:
1. Ambos scripts iniciam em paralelo (ou com pequeno delay)
2. Backend: Porta 4300 (node dist/app.js)
3. Frontend: Porta 4173 (serve-frontend.js)
4. Logs: deploy/production/logs/backend.log, frontend.log
```

---

## 📌 Scripts e Responsabilidades

### 1. `register-startup-tasks.ps1` (Maestro)
**Propósito:** Registrar tarefas no Windows Task Scheduler

**Comportamento:**
- ✅ Requer execução como **Administrator**
- ✅ Cria duas tarefas no Task Scheduler
- ✅ Usa conta SYSTEM (não vinculada a usuário específico)
- ✅ RunLevel: **Highest** (privilégio de administrador)
- ✅ Settings:
  - `AllowStartIfOnBatteries`: true (máquinas portáteis)
  - `DontStopIfGoingOnBatteries`: true (não interrompe em modo bateria)
  - `StartWhenAvailable`: true (tenta recuperar se missed)

**Tarefa 1: ControleEstoqueBackend**
```
Trigger: AtStartup (Windows boot)
Action: powershell.exe -NoProfile -ExecutionPolicy Bypass -File "...\start-backend.ps1"
Principal: SYSTEM (Highest privilege)
```

**Tarefa 2: ControleEstoqueFrontend**
```
Trigger: AtStartup (Windows boot)
Action: powershell.exe -NoProfile -ExecutionPolicy Bypass -File "...\start-frontend.ps1"
Principal: SYSTEM (Highest privilege)
```

**Timing:** Ambas disparam de forma independente no boot. Frontend pode iniciar antes de backend estar pronto.

---

### 2. `start-backend.ps1` (Backend Executor)
**Propósito:** Iniciar processo Node.js do backend na porta 4300

**Fluxo de Execução:**
```
1. Definir variáveis de ambiente:
   - PORT=4300 (se não definido)
   - NODE_ENV=production
   
2. Limpar porta 4300:
   - Executa free-port.js
   - Mata qualquer processo ouvindo na porta
   
3. Iniciar backend:
   - Executa: node dist/app.js
   - Working directory: deploy/production/backend/
   - Redirects:
     * stdout → deploy/production/logs/backend.log
     * stderr → deploy/production/logs/backend-error.log
   - Modo: Start-Process (detached, não aguarda conclusão)
   
4. Retorna ao PowerShell (process em background)
```

**Dependências de Sucesso:**
- ✅ `deploy/production/backend/dist/app.js` existe
- ✅ `deploy/production/backend/package.json` com dependencies instaladas
- ✅ `deploy/production/backend/.env` com credenciais DB
- ✅ `.env` contém: `PORT=4300`, `NODE_ENV=production`, conexão MSSQL

**Sinais de Erro:**
- ❌ `NODE_ENV not found` → Verificar package.json
- ❌ `Cannot find module` → Executar `npm install` em backend
- ❌ `EADDRINUSE :4300` →  Porta ocupada (free-port.js falhou)
- ❌ `Database connection failed` → Verificar .env com credenciais

---

### 3. `start-frontend.ps1` (Frontend Executor)
**Propósito:** Iniciar servidor HTTP para frontend estático na porta 4173

**Fluxo de Execução:**
```
1. Definir variáveis de ambiente:
   - PORT=4173 (se não definido)
   - FRONTEND_PORT=$env:PORT
   
2. Criar diretório de logs:
   - deploy/production/logs/
   
3. Limpar porta 4173:
   - Executa free-port.js (detecta PORT da env)
   - Mata qualquer processo ouvindo na porta
   
4. Iniciar frontend server:
   - Executa: node serve-frontend.js
   - Working directory: deploy/production/scripts/
   - Redirects:
     * stdout → deploy/production/logs/frontend.log
     * stderr → deploy/production/logs/frontend-error.log
   - Modo: Start-Process (detached, não aguarda conclusão)
   
5. Retorna ao PowerShell (process em background)
```

**Dependências de Sucesso:**
- ✅ `deploy/production/scripts/serve-frontend.js` existe
- ✅ `deploy/production/frontend/dist/` existe com arquivos estáticos
- ✅ `deploy/production/frontend/dist/index.html` presente

**Sinais de Erro:**
- ❌ `Cannot find module http` → Não deve haver (built-in)
- ❌ `EADDRINUSE :4173` → Porta 4173 ocupada (free-port.js falhou)
- ❌ `ENOENT /frontend/dist/` → Build não executado

---

### 4. `free-port.js` (Liberador de Porta)
**Propósito:** Garantir que porta alvo está livre antes de iniciar serviço

**Assinatura:**
```
node free-port.js  (lê PORT da environment ou usa 4300 como padrão)
```

**Fluxo:**
```
1. Ler porta alvo:
   - De process.env.PORT
   - Ou usar DEFAULT_PORT (4300)
   - Validar se inteiro > 0
   
2. Detectar processos ouvindo na porta (Windows):
   - Executar: netstat -ano -p tcp
   - Parser output para encontrar todas linhas com:
     * Protocolo: TCP
     * Estado: LISTENING
     * Porta local: <target_port>
   - Extrair PIDs
   
3. Matar processos encontrados:
   - Para cada PID: taskkill /PID {pid} /F /T
     * /F = Force kill
     * /T = Kill tree (sub-processes também)
   - Silencxar erros se PID não existir
   
4. Relatar:
   - Se porta livre: "[free-port] Porta {port} ja esta livre."
   - Se matou processos: "[free-port] Processo {pid} encerrado."
```

**Retorno:**
- ✅ exit code 0 = Porta livre (ou foi liberada)
- ❌ exit code 1 = Porta inválida

---

### 5. `serve-frontend.js` (Servidor Estático)
**Propósito:** HTTP server para servir arquivos React SPA

**Características:**
```
1. Configuração:
   - Porta: process.env.FRONTEND_PORT ou 4173
   - Root Directory: deploy/production/frontend/dist/
   - MIME types: html, js, css, json, svg, png, jpg, ico, woff2

2. Roteamento:
   - GET / → serve index.html (SPA root)
   - GET /assets/* → serve arquivos estáticos com MIME correto
   - GET /<path> → fallback para index.html (React Router)

3. Handlers:
   - Se arquivo existe e é file: retorna com MIME type correto
   - Se não existe ou é diretório: fallback para index.html
   - Path traversal protection: rejeita .. e paths fora de rootDir (403 Forbidden)

4. Logging:
   - Console: "[frontend] Servindo arquivos estaticos em http://localhost:{port}"
```

---

## ✅ Checklist Pré-Ativação

Antes de executar `register-startup-tasks.ps1`, verifique:

### Backend Setup
- [ ] `deploy/production/backend/dist/app.js` existe
- [ ] `deploy/production/backend/package.json` existe
- [ ] `deploy/production/backend/node_modules/` foi populado (`npm install` foi rodado)
- [ ] `deploy/production/backend/.env` existe com:
  - [ ] `PORT=4300`
  - [ ] `NODE_ENV=production`
  - [ ] Connection string MSSQL com credenciais validadas
  - [ ] Todas variáveis de ambiente necessárias
- [ ] Testou backend localmente: `cd deploy/production/backend && node dist/app.js`

### Frontend Setup
- [ ] `deploy/production/frontend/dist/` existe
- [ ] `deploy/production/frontend/dist/index.html` existe
- [ ] `deploy/production/frontend/dist/assets/` contém .js, .css, .png, etc
- [ ] `deploy/production/scripts/serve-frontend.js` existe
- [ ] `.env.production` em front-end/ contém `VITE_API_BASE_URL=http://localhost:4300`
- [ ] Testou server localmente: `cd deploy/production/scripts && node serve-frontend.js`

### Scripts & Paths
- [ ] `deploy/production/scripts/register-startup-tasks.ps1` existe
- [ ] `deploy/production/scripts/start-backend.ps1` existe
- [ ] `deploy/production/scripts/start-frontend.ps1` existe
- [ ] `deploy/production/scripts/free-port.js` existe
- [ ] `deploy/production/logs/` directory existe (criado automaticamente por scripts)

### Windows Environment
- [ ] PowerShell versão 5.1+ (`$PSVersionTable.PSVersion`)
- [ ] Executar próximo comando como Administrator
- [ ] Sem softwares antivírus bloqueando Task Scheduler
- [ ] Task Scheduler service está rodando (`Get-Service Schedule`)

### Validações Finais
- [ ] Backend compila sem erros: `cd back-end && npm run build`
- [ ] Frontend compila sem erros: `cd front-end && npm run build`
- [ ] Últimas builds foram copiadas: `.\deploy\production\scripts\prepare-deploy.ps1`
- [ ] Database está acessível de http://localhost
- [ ] Nenhum outro serviço usando portas 4300 ou 4173

---

## 🚀 Ativação (Command)

**Executar como Administrator:**

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
$scriptPath = "C:\controle-estoque\deploy\production\scripts\register-startup-tasks.ps1"
& $scriptPath
```

**Output Esperado:**
```
Tarefas de inicializacao registradas com sucesso.
```

**Verificar no Task Scheduler:**
```powershell
Get-ScheduledTask -TaskName "ControleEstoque*" | Format-Table TaskName, State, NextRunTime
```

Esperado:
```
TaskName                   State   NextRunTime
--------                   -----   -----------
ControleEstoqueBackend     Ready   (Next system boot)
ControleEstoqueFrontend    Ready   (Next system boot)
```

---

## 🧪 Teste de Startup

### Teste A: Iniciar Manualmente (Sem Reboot)
```powershell
# Window 1: Backend
C:\controle-estoque\deploy\production\scripts\start-backend.ps1

# Window 2: Frontend (em nova PowerShell)
C:\controle-estoque\deploy\production\scripts\start-frontend.ps1

# Window 3: Verificar portas
netstat -ano | findstr :430
netstat -ano | findstr :417
```

Esperado:
```
TCP    127.0.0.1:4300         0.0.0.0:0         LISTENING       <pid>
TCP    0.0.0.0:4173           0.0.0.0:0         LISTENING       <pid>
```

### Teste B: Verificar Conectividade
```powershell
# Backend health check
Invoke-WebRequest -Uri "http://localhost:4300/saude" -ErrorAction SilentlyContinue

# Frontend load check
Invoke-WebRequest -Uri "http://localhost:4173/" -ErrorAction SilentlyContinue
```

### Teste C: Verificar Logs
```powershell
# Ver logs do backend (últimas 20 linhas)
Get-Content -Path "C:\controle-estoque\deploy\production\logs\backend.log" -Tail 20

# Ver logs de erro do backend
Get-Content -Path "C:\controle-estoque\deploy\production\logs\backend-error.log" -Tail 20

# Ver logs do frontend
Get-Content -Path "C:\controle-estoque\deploy\production\logs\frontend.log" -Tail 20
```

### Teste D: Smoke Test Completo (Pós Boot Agendado)
1. Reboot do Windows
2. Aguarde 30 segundos
3. Verifique portas: `netstat -ano | findstr :430`
4. Acesse browser: `http://localhost:4173`
5. Faça login, teste movimentação de estoque
6. Verifique logs para erros

---

## 🚨 Troubleshooting

| Sintoma | Causa Possível | Solução |
|---------|----------------|--------|
| Task Scheduler não inicia nada | Executar como admin was forgotten | Rerun `register-startup-tasks.ps1` como Admin |
| Porta 4300 já em uso | Processo antigo não foi killado | `taskkill /F /IM node.exe` e retry |
| Backend não consegue conectar DB | Credenciais inválidas em .env | Verificar `deploy/production/backend/.env` |
| Frontend mostra "Cannot GET /" | serve-frontend.js não iniciou | Verifique logs frontend e erro |
| Aplicação não carrega em browser | Both services precisam rodar | Verifique ambos os logs |
| Task roda mas app não inicia | Working directory incorrect | Verifique caminhos em start-*.ps1 |

---

## 📄 Próximas Etapas

1. ✅ **Executar Checklist Pré-Ativação**
2. ✅ **Executar Teste A (Manual Start)**
3. ✅ **Executar Teste B e C (Connectivity + Logs)**
4. ✅ **Reboot Windows**
5. ✅ **Executar Teste D (Smoke Test)**
6. ✅ **Monitorar logs por 24-48h em produção**

---

## 📝 Notas de Segurança

- **SYSTEM Account:** Scripts rodam com máximas permissões - revisar regularmente
- **Portas 4300/4173:** Apenas localhost por default - adicionar firewall se acessar remotamente
- **Logs:** Deploy em `/logs/` - considerar rotação periodicamente
- **Node Processes:** Sem auto-restart se falhar - considerar PM2 em produção real futura
- **Banco de Dados:** Credenciais em .env - nunca commitar em git

---

**Última Atualização:** 2025-03-17  
**Status:** ✅ Pronto para Ativação  
**Autor:** Automation Setup  
