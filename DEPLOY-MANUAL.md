> Documento historico do IIS. Para testes atuais por PM2/IP, use docs/teste-pm2-ip.md e iniciar-teste-pm2.ps1. Para uma publicacao futura no IIS, use DEPLOY-IIS.md revisado. Os status e portas abaixo nao representam validacao atual.

# 🎯 DEPLOY - Procedimento Rápido

## Status ✅ Concluído

- ✅ Backend compilado: `C:\controle-estoque\deploy\production\backend\dist\`
- ✅ Frontend compilado: `C:\controle-estoque\front-end\dist\`
- ✅ `web.config` atualizado para apontar para `localhost:3000`

---

## 🚀 4 Passos Finais

### Passo 1: Copiar Frontend para IIS

**Manualmente no Windows Explorer:**
1. Abra: `C:\controle-estoque\front-end\dist`
2. Selecione tudo: `Ctrl+A`
3. Copie: `Ctrl+C`
4. Abra nova janela: `C:\inetpub\controle-estoque-proxy`
5. Cole aqui: `Ctrl+V`

**Resultado esperado:**
```
C:\inetpub\controle-estoque-proxy\
├── index.html
├── web.config  ← NÃO sobrescrever!
└── assets/
    ├── index-xxx.css
    └── index-xxx.js
```

---

### Passo 2: Verificar Certificado HTTPS

O IIS precisa servir com HTTPS em `estoque.local`.

**No IIS Manager:**
1. Site `ControleEstoque_Proxy`
2. Bindings → Verificar HTTPS binding com certificado válido

---

### Passo 3: Iniciar Backend

**Abra PowerShell como ADMINISTRADOR:**
```powershell
cd "C:\controle-estoque\deploy\production\backend"
npm install --production
node dist/app.js
```

**Saída esperada:**
```
Servidor rodando em http://localhost:3000
```

---

### Passo 4: Testar

✅ **Frontend:**
```
https://estoque.local
```

✅ **Backend via Proxy:**
```
https://estoque.local/api-docs
```

✅ **Backend direto (teste):**
```
http://localhost:3000/api-docs
```

---

## 📋 Checklist

- [ ] Frontend copiado para `C:\inetpub\controle-estoque-proxy`
- [ ] `web.config` aponta para `localhost:3000`
- [ ] HTTPS/Certificado configurado no IIS
- [ ] Backend rodando em `localhost:3000`
- [ ] Acessa `https://estoque.local` ✅
- [ ] API responde em `https://estoque.local/api-docs` ✅

---

## 📁 Arquitetura Final

```
┌─────────────────────────────────────┐
│   Browser: https://estoque.local   │
└────────────────┬────────────────────┘
                 │
         ┌───────▼────────┐
         │     IIS        │
         │ (proxy reverso)│
         └───────┬────────┘
                 │
        ┌────────┴────────┐
        │                 │
   ┌────▼──────┐   ┌─────▼────────┐
   │ /api/* →  │   │ /* →         │
   │ localhost │   │ index.html   │
   │  :3000    │   │ (SPA route)  │
   │ Backend   │   │              │
   │ Node.js   │   │ Frontend     │
   │           │   │ React/Vite   │
   └───────────┘   └──────────────┘
```

---

## 🔧 Troubleshooting

### Frontend em branco / 404
→ Verificar se `index.html` existe em `C:\inetpub\controle-estoque-proxy\`

### API não responde
→ Verificar se backend está rodando: `netstat -ano | findstr :3000`

### CORS bloqueando
→ Já configurado em `app.ts` ✅

### Backend crashou
→ Ver erro no terminal
→ Verificar `.env` tem credenciais corretas

---

## 💾 Automatizar Deploys Futuros

Use o script em: `C:\controle-estoque\deploy\production\scripts\prepare-deploy-iis.ps1`

```powershell
# Execute como ADMIN
cd "C:\controle-estoque\deploy\production\scripts"
.\prepare-deploy-iis.ps1
```

Ele faz:
- Build backend + frontend
- Deploy backend
- Deploy frontend para IIS
- npm install

---

**✅ Pronto! Seu sistema está em produção!**
