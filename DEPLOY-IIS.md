# 📋 Guia de Deploy para IIS com Proxy Reverso

## ✅ Status Atual

- ✅ Backend compilado em: `C:\controle-estoque\deploy\production\backend\dist\`
- ✅ Frontend compilado em: `C:\controle-estoque\front-end\dist\`
- ✅ IIS Site criado: `ControleEstoque_Proxy` → `C:\inetpub\controle-estoque-proxy`

---

## 🚀 Próximos Passos

### 1️⃣ Copiar Frontend para IIS

**Opção A: Via PowerShell (Recomendado)**
```powershell
# Executar como ADMINISTRADOR
Copy-Item -Path "C:\controle-estoque\front-end\dist\index.html" `
          -Destination "C:\inetpub\controle-estoque-proxy\index.html" -Force

Copy-Item -Path "C:\controle-estoque\front-end\dist\assets" `
          -Destination "C:\inetpub\controle-estoque-proxy\assets" `
          -Recurse -Force
```

**Opção B: Manual no Explorer**
1. Abra `C:\controle-estoque\front-end\dist\`
2. Selecione tudo: `Ctrl+A`
3. Copie: `Ctrl+C`
4. Abra `C:\inetpub\controle-estoque-proxy\`
5. Cole: `Ctrl+V`

---

### 2️⃣ Configurar IIS para Proxy Reverso

O IIS precisa redirecionar requisições `/api/*` para o backend Node.js.

**Instalar URL Rewrite Module (se ainda não tiver):**
https://www.iis.net/downloads/microsoft/url-rewrite

**Adicionar regra de rewrite em `C:\inetpub\controle-estoque-proxy\web.config`:**

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Proxy to Backend" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:3000/api/{R:1}" />
        </rule>
      </rules>
    </rewrite>
    
    <!-- SPA Routing: Redirecionar para index.html -->
    <rewrite>
      <rules>
        <rule name="Handle SPA Routes" stopProcessing="true">
          <match url=".*" />
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/(api|assets)" negate="true" />
          </conditions>
          <action type="Rewrite" url="index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

---

### 3️⃣ Iniciar Backend

**Terminal PowerShell (como ADMINISTRADOR):**
```powershell
cd "C:\controle-estoque\deploy\production\backend"
node dist/app.js
```

**Saída esperada:**
```
Servidor rodando em http://localhost:3000
```

---

### 4️⃣ Testar Conectividade

✅ **Frontend (via IIS):**
```
https://estoque.local
```

✅ **Backend direto:**
```
http://localhost:3000/api-docs
```

✅ **Backend via proxy (IIS):**
```
https://estoque.local/api-docs
```

---

## 🔍 Checklist de Configuração

- [ ] Frontend copiado para `C:\inetpub\controle-estoque-proxy`
- [ ] `web.config` com regras de proxy adicionado
- [ ] Backend rodando em `http://localhost:3000`
- [ ] Certificado HTTPS válido para `estoque.local`
- [ ] DNS/Hosts local tem `estoque.local` → `192.168.0.69`
- [ ] IIS App Pool com permissões adequadas
- [ ] Firewall permite acesso 🔥

---

## 📁 Estrutura Final

```
C:\inetpub\controle-estoque-proxy/
├── index.html
├── web.config              ← Proxy reverso + SPA routing
└── assets/
    ├── index-xxxxx.css
    └── index-xxxxx.js

C:\controle-estoque\deploy\production\backend/
├── dist/                   ← Código compilado (TypeScript→JS)
├── node_modules/
├── package.json
└── .env
```

---

## 🆘 Troubleshooting

### Frontend não carrega
- Verificar se `C:\inetpub\controle-estoque-proxy\index.html` existe
- Verificar logs do IIS: `C:\inetpub\logs\LogFiles\`

### API não responde
- Verificar se backend está rodando: `netstat -ano | findstr :3000`
- Verificar CORS em `app.ts` (já configurado ✅)

### CORS bloqueando
- Confirmar que `https://estoque.local` está em `allowedOrigins` ✅

---

## 🎯 Automation (Futuro)

Para automatizar, edite `C:\controle-estoque\deploy\production\scripts\prepare-deploy-iis.ps1`

Ele já faz:
1. Build backend + frontend
2. Deploy para `C:\inetpub\controle-estoque-proxy`
3. Deploy para `C:\controle-estoque\deploy\production\backend`
4. Instala dependências npm
