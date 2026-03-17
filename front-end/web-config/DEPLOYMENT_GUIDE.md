# ✅ Checklist de Deployment HTTPS - Passo a Passo

## 📦 Arquivos Prontos em `c:\controle-estoque\front-end\web-config\`

- `web.config` - Configuração completa com HTTPS, proxy e routing
- `deploy-webconfig.ps1` - Script de deployment automatizado (ADMIN)
- `README.md` - Documentação técnica

---

## 🚀 Deployment Rápido (5 minutos)

### Passo 1: Abrir PowerShell como ADMINISTRADOR

```
1. Clique em "Iniciar"
2. Digite "PowerShell"
3. Clique com botão direito em "Windows PowerShell"
4. Selecione "Executar como administrador"
```

### Passo 2: Executar Script de Deploy

```powershell
cd "C:\controle-estoque\front-end\web-config"
.\deploy-webconfig.ps1
```

### Passo 3: Validar

Se tudo OK, você verá:
```
✅ Frontend respondendo: HTTP 200
✅ API respondendo: HTTP 200
✅ Redirect ativo: HTTP 301
✅ Deploy Concluído!
```

### Passo 4: Acessar no Navegador

```
https://estoque.local
```

---

## 📋 Manual (Se preferir não usar script)

Se não quiser rodar o script, copie manualmente:

### 1. Como Administrador, execute:

```powershell
Copy-Item "C:\controle-estoque\front-end\web-config\web.config" `
          "C:\inetpub\controle-estoque-proxy\web.config" -Force
```

### 2. Reiniciar IIS:

```powershell
iisreset
```

### 3. Testar:

```powershell
Invoke-WebRequest "https://estoque.local/api-docs" -SkipCertificateCheck
```

---

## 🔍 O que Acontece Após Deploy

| Acesso | Vai Para | Status |
|--------|----------|--------|
| `http://estoque.local` | `https://estoque.local` | 301 Redirect |
| `https://estoque.local` | Frontend estático (React) | 200 OK |
| `https://estoque.local/api/*` | `http://localhost:3000/api/*` | Proxy |
| `https://estoque.local/login` | Frontend (SPA) | 200 OK |
| `https://estoque.local/produtos` | Frontend (SPA) | 200 OK |

---

## ⚠️ Se Algo Não Funcionar

### "Certificate error" no navegador
→ Certificado SSL não bate com host. Verificar IIS Manager.

### "502 Bad Gateway" em API
→ Backend não está rodando em `localhost:3000`.
```powershell
# Iniciar backend
cd "C:\controle-estoque\deploy\production\backend"
node dist/app.js
```

### "404 Not Found"
→ Frontend não está em `C:\inetpub\controle-estoque-proxy\`.
```powershell
# Copiar frontend
Copy-Item "C:\controle-estoque\front-end\dist\*" `
          "C:\inetpub\controle-estoque-proxy\" -Recurse -Force
```

### IIS não responde
→ Serviço parado.
```powershell
Start-Service W3SVC
```

---

## 📞 Validação Rápida (Cmd)

```powershell
# Verificar IIS rodando
Get-Service W3SVC | Select-Object Status

# Verificar porta 80/443
Get-NetTCPConnection -LocalPort 443 -State Listen

# Verificar backend rodando
Get-NetTCPConnection -LocalPort 3000 -State Listen

# Verificar certificado
Get-ChildItem cert: | Where-Object { $_.Subject -like "*estoque.local*" }
```

---

## ✅ Confirmar Sucesso

1. ✅ Abrir `https://estoque.local`
2. ✅ Página carrega sem erro
3. ✅ Conseguir fazer login
4. ✅ Navegar para produtos
5. ✅ Ver dados carregando (API respondendo)
6. ✅ Console (F12) sem erros CORS

---

## 📝 Notas

- HTTPS é obrigatório em prod ✅
- Certificado pode ser auto-assinado (lab) ou válido (prod) ✅
- Backend precisa estar rodando ✅
- Frontend precisa estar em `C:\inetpub\controle-estoque-proxy\` ✅

**Pronto para usar! 🚀**
