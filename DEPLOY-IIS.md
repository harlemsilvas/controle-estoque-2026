# Atualizacao no Windows / IIS

Revisado em 2026-10-05 — autenticacao, perfis, relatorios e totalizacoes.

`git pull` atualiza os fontes. O IIS serve arquivos compilados e a API Node usa outro diretorio; portanto e necessario instalar dependencias, compilar, publicar e reiniciar o backend.

## Antes de atualizar

- Use o clone oficial `C:\controle-estoque` (ajuste se o clone estiver em outro caminho), branch main, sem alteracoes locais conflitantes.
- Preserve backup dos artefatos publicados e configuracao antes da troca. O script preserva `.env`, `web.config`, logs e revogacoes de sessao; nao encerra processos automaticamente.
- O `.env` de producao fica em `deploy\production\backend\.env`. Confira DB_USER, DB_PASSWORD, DB_SERVER e DB_NAME; mantenha as credenciais do Windows. JWT_SECRET agora deve ter pelo menos 32 caracteres. Nao copie indiscriminadamente o `.env` do Linux e nao publique segredos no Git.
- Confirme a porta efetiva da API: o ecosystem PM2 deste repositorio usa **4300**; `node dist/app.js` usa PORT do ambiente/.env, ou 3000 se ausente. IIS, processo e parametro BackendPort devem usar a mesma porta.
- Banco local utilizado: SERVER-ABC / 192.168.0.69. As tabelas AccessProfiles/AccessProfileAudit e perfis base ja foram aplicados nesse banco. Se o IIS aponta para o MESMO banco (DB_SERVER + DB_NAME), nao ha migration adicional. O preflight verifica isso sem escrever. Para outro banco, aplicar explicitamente `back-end/sql/patch-access-profiles.sql` e validar com `patch-access-profiles-verify.sql` antes da troca.

## Sequencia com PM2 existente

PowerShell no servidor, com permissao para escrever no diretorio publicado. Execute na mesma conta/PM2_HOME que gerencia o backend. Nao inicie outra instancia sob uma conta diferente.

```powershell
$ErrorActionPreference = 'Stop'
cd C:\controle-estoque
git pull --ff-only origin main
if ($LASTEXITCODE -ne 0) { throw 'Git pull falhou; interrompa a atualizacao.' }

$env:PM2_HOME = Join-Path (Get-Location) 'deploy\production\.pm2'
pm2 list
pm2 stop controle-estoque-backend
if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel parar o backend; interrompa.' }

& .\deploy\production\scripts\prepare-deploy-iis.ps1 -BackendPort 4300
# Se o script falhar, nao prossiga para reinicio sem resolver a falha.
pm2 restart controle-estoque-backend --update-env
if ($LASTEXITCODE -ne 0) { throw 'Reinicio falhou.' }
pm2 save

Invoke-RestMethod http://127.0.0.1:4300/health
Invoke-RestMethod https://estoque.local/api/health
```

O script instala dependencias com npm ci, verifica configuracao/banco, compila backend e frontend, forca VITE_API_BASE_URL=/api no build IIS e publica sem apagar configuracoes. Existe indisponibilidade enquanto a API esta parada. Nao use o antigo `prepare-deploy.ps1` neste fluxo, pois ele ainda limpa o diretorio de runtime.

Se a API usa servico Windows/tarefa/terminal em vez de PM2, pare e reinicie somente esse backend pelo gerenciador existente; nao execute os comandos PM2. Para execucao manual, use o diretorio `deploy\production\backend` e `node dist/app.js`, com PORT igual ao parametro e ao proxy. O script de publicacao nao registra servicos nem altera a inicializacao do Windows.

## Proxy IIS

Preservar o web.config existente. A API define /login, /me, /produto etc., **sem /api**. A regra do IIS deve retirar esse prefixo. Exemplo para API na porta 4300, com um unico bloco rewrite/rules:

```xml
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Proxy API" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://127.0.0.1:4300/{R:1}" />
        </rule>
        <rule name="SPA" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/(api|assets)(/|$)" negate="true" />
          </conditions>
          <action type="Rewrite" url="index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

URL Rewrite e ARR com proxy habilitado sao requisitos do IIS existente. Ajuste a regra dentro da configuracao atual, preservando outros ajustes. Se a porta for 3000, altere a action e -BackendPort para 3000 e confira o processo.

## Validacao apos publicar

1. /health direto e /api/health pelo IIS devem retornar 200.
2. /api/produto sem login deve retornar 401 (comportamento correto).
3. Recarregar frontend e fazer novo login; tokens anteriores a revisao de autenticacao podem ser invalidos.
4. Validar Harlem/Monica em Admin → Perfis e Usuarios; Somente leitura nao pode cadastrar, editar, excluir ou movimentar.
5. Validar cadastros, associacao em lote, relatorios/CSV e totalizacoes por marca/fornecedor/familia.
6. Verificar logs do backend e do IIS se houver erro; nao publicar senhas ou tokens.

## Estado de validacao

Builds e testes de API/SQL aprovados no Linux; banco compartilhado e endpoints locais conferidos. O PowerShell de deploy e a configuracao IIS foram revisados, mas nao executados no Windows nesta sessao. O deploy so sera confirmado depois das verificacoes acima no servidor.
