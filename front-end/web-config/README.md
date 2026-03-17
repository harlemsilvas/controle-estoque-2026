# Web.config para Produção com HTTPS

## 📋 Conteúdo

- `web.config` - Configuração completa de IIS para ambiente de produção com HTTPS

## 🚀 Como Usar

### 1. Copiar para o Servidor (como Administrador)

```powershell
# No seu computador (com direitos de admin):
Copy-Item "C:\controle-estoque\front-end\web-config\web.config" `
          "C:\inetpub\controle-estoque-proxy\web.config" -Force
```

### 2. Validar

Após copiar, o IIS deve:
- ✅ Redirecionar `http://estoque.local` → `https://estoque.local`
- ✅ Servir frontend estático de `C:\inetpub\controle-estoque-proxy\dist\`
- ✅ Fazer proxy de requisições de API para `http://localhost:3000` (backend)
- ✅ Manter SPA routing (React Router funciona corretamente)

### 3. Testar

```powershell
# Test Frontend
Invoke-WebRequest "https://estoque.local" -SkipCertificateCheck

# Test API via Proxy
Invoke-WebRequest "https://estoque.local/api-docs" -SkipCertificateCheck
```

## 🔧 O que está configurado

### ✅ Segurança HTTPS
- Redirect automático HTTP → HTTPS
- Headers de segurança (X-Content-Type-Options, X-Frame-Options, etc)

### ✅ Proxy Reverso
- `/api/*` → `http://localhost:3000/api/`
- `/api-docs` e `/swagger` → Backend
- Rotas de autenticação: `/login`, `/usuarios`, etc → Backend
- Headers X-Forwarded-* para o backend saber que vem via HTTPS

### ✅ Frontend Estático
- Assets servidos localmente de `C:\inetpub\controle-estoque-proxy\dist\`
- Compressão gzip ativa
- Cache de 30 dias para assets

### ✅ SPA Routing
- Qualquer rota não encontrada redireciona para `/index.html`
- React Router continua funcionando (client-side)

## 📝 Variáveis de Ambiente

O arquivo assume:
- **Host**: `estoque.local`
- **Backend Node.js**: `localhost:3000`
- **Frontend estático**: `C:\inetpub\controle-estoque-proxy\`
- **SSL/TLS**: Já configurado no IIS

## ⚙️ Pré-requisitos

- [ ] IIS com URL Rewrite Module instalado
- [ ] Certificado SSL válido para `estoque.local`
- [ ] Backend Node.js rodando em `http://localhost:3000`
- [ ] Frontend build estático em `C:\inetpub\controle-estoque-proxy\`

## 🔄 Workflow de Deploy

```powershell
# 1. Build Frontend (dev)
cd C:\controle-estoque\front-end
npm run build

# 2. Copiar para IIS (ADMIN)
Copy-Item "C:\controle-estoque\front-end\dist\*" `
          "C:\inetpub\controle-estoque-proxy\" -Recurse -Force

# 3. Copiar web.config (ADMIN)
Copy-Item "C:\controle-estoque\front-end\web-config\web.config" `
          "C:\inetpub\controle-estoque-proxy\web.config" -Force

# 4. Backend rodando
cd C:\controle-estoque\deploy\production\backend
npm install --production
node dist/app.js

# 5. Testar
Start-Process "https://estoque.local"
```

## 🆘 Troubleshooting

### Site não responde
- Verificar se IIS está rodando: `Get-Service W3SVC`
- Certificado SSL válido: IIS Manager → Site bindings
- URL Rewrite ativo: `Get-WindowsFeature Web-Rewrite`

### CORS bloqueando
- Backend em `app.ts` já tem CORS configurado ✅
- Verificar que requisições vêm via `estoque.local` (não IP direto)

### Assets (CSS/JS) não carregam
- Verificar `C:\inetpub\controle-estoque-proxy\assets\` existe com arquivos
- Permissões IIS App Pool podem acessar a pasta

### API retorna 502 Bad Gateway
- Backend não está rodando em `localhost:3000`
- Terminal backend travou - reiniciar com `node dist/app.js`
- Firewall bloqueando port 3000

## 📞 Contato

Se houver erro ao copiar ou aplicar, rode como **Administrador** e confirme com:
```powershell
Test-Path "C:\inetpub\controle-estoque-proxy\web.config"
```
