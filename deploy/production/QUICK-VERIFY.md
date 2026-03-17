# Quick Verification Checklist - Antes de Ativar Task Scheduler

## 🎯 Verificação Rápida (5 minutos)

Execute este comando para testar tudo antes de registrar no Task Scheduler:

```powershell
# Step 1: Verificar arquivos críticos
$items = @(
    'C:\controle-estoque\deploy\production\backend\dist\app.js',
    'C:\controle-estoque\deploy\production\backend\.env',
    'C:\controle-estoque\deploy\production\frontend\dist\index.html',
    'C:\controle-estoque\deploy\production\scripts\serve-frontend.js',
    'C:\controle-estoque\deploy\production\scripts\free-port.js'
)

foreach ($item in $items) {
    if (Test-Path $item) { Write-Host "✅ $item" }
    else { Write-Host "❌ MISSING: $item"; exit 1 }
}

# Step 2: Testar backend manualmente
Write-Host "`n[TEST] Iniciando backend na porta 4300..."
Set-Location 'C:\controle-estoque\deploy\production\backend'
Start-Process -FilePath 'node' -ArgumentList 'dist/app.js' -NoNewWindow -PassThru | Tee-Object -Variable backendPid | Out-Null
Start-Sleep -Seconds 3

# Step 3: Testar conexão
Write-Host "[TEST] Verificando se backend respondeu na porta 4300..."
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:4300/saude' -ErrorAction Stop
    Write-Host "✅ Backend respondeu: $response.StatusCode"
} catch {
    Write-Host "❌ Backend não respondeu: $_"
    exit 1
}

# Step 4: Matar backend teste
Write-Host "[CLEANUP] Matando backend de teste..."
taskkill /F /IM node.exe

Write-Host "`n✅ Todos os testes passaram! Seguro para ativar Task Scheduler."
```

---

## ✅ Checklist Minimalista

- [ ] Backend build recente? `cd back-end && npm run build`
- [ ] Frontend build recente? `cd front-end && npm run build`
- [ ] Backend .env tem PORT=4300 e DB credentials? `cat deploy\production\backend\.env`
- [ ] Frontend dist tem index.html? `dir deploy\production\frontend\dist\index.html`
- [ ] Pode iniciar manualmente? `.\deploy\production\scripts\start-backend.ps1`
- [ ] Portas 4300 e 4173 estão livres? `netstat -ano | findstr :430`
- [ ] PowerShell rodando como Admin? `[Security.Principal.WindowsIdentity]::GetCurrent().Owner`

---

## 🔴 STOP - Se algum check falhar

**Não prossiga para Task Scheduler até resolver:**

1. ❌ Arquivo não existe → Executar `.\deploy\production\scripts\prepare-deploy.ps1`
2. ❌ .env inválido → Copiar template: `copy deploy\production\config\back-end.env.example .env`
3. ❌ Porta em uso → `taskkill /F /IM node.exe` then `node free-port.js`
4. ❌ Backend não respondeu → Verificar `deploy\production\logs\backend-error.log`

---

## ✅ Se tudo passou, executar como Admin:

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
& 'C:\controle-estoque\deploy\production\scripts\register-startup-tasks.ps1'
```

Então reboot e teste: http://localhost:4173

---

**Tempo estimado:** 5 min | **Risco:** Baixo | **Rollback:** Simples (Delete Tasks no Scheduler)
