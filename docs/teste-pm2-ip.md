# Teste com PM2 e acesso direto por IP

Preparado em 2026-10-06. Versao publicada: C:\controle-estoque. Nova versao: C:\controle-estoque-2026. IIS fica fora do fluxo atual. Este roteiro nao foi executado; nenhum processo PM2 foi iniciado.

| Versao | API | Frontend |
| --- | --- | --- |
| Publicada | 4300 | 4173 |
| Nova para teste | 4301 | 4174 |

O ecosystem existente usa as portas de producao: nao iniciar essa configuracao para testar em paralelo. Usar a mesma conta e PM2_HOME da operacao, com nomes diferentes. Nao executar stop/delete all nem scripts de liberacao de portas. O npm start da API executa prestart/free-port; usar node via PM2 diretamente.

O build atual do frontend usa http://192.168.0.69:4301, IP local encontrado nesta verificacao. A API recebe as chamadas sem /api. Se o IP ou porta mudar, recompilar o frontend com VITE_API_BASE_URL ajustado. Nao usar localhost para acesso de outros computadores.

## Recompilar

```powershell
Set-Location C:\controle-estoque-2026\back-end
npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw 'Build backend falhou.' }
Set-Location C:\controle-estoque-2026\front-end
$previousApi = $env:VITE_API_BASE_URL
try {
  $env:VITE_API_BASE_URL = 'http://192.168.0.69:4301'
  npm.cmd run build
  if ($LASTEXITCODE -ne 0) { throw 'Build frontend falhou.' }
} finally { $env:VITE_API_BASE_URL = $previousApi }
```

## Iniciar quando autorizado

Verificar que 4301/4174 estao livres sem encerrar processos existentes. Usar back-end/.env desta copia, preservando seus segredos. Pastas e portas diferentes nao isolam o banco: configurar banco de teste antes de validar cadastros, exclusoes ou movimentacoes. HTTP nao cifra senhas/tokens; manter o teste na rede local confiavel, sem exposicao a internet.

```powershell
Set-Location C:\controle-estoque-2026
$previousPort = $env:PORT
$previousMode = $env:NODE_ENV
try {
  $env:PORT = '4301'
  $env:NODE_ENV = 'production'
  pm2 start C:\controle-estoque-2026\back-end\dist\app.js --cwd C:\controle-estoque-2026\back-end --name controle-estoque-2026-api-teste
  if ($LASTEXITCODE -ne 0) { throw 'Inicio da API falhou.' }
} finally {
  $env:PORT = $previousPort
  $env:NODE_ENV = $previousMode
}
pm2 serve C:\controle-estoque-2026\front-end\dist 4174 --name controle-estoque-2026-web-teste --spa
if ($LASTEXITCODE -ne 0) { throw 'Inicio do frontend falhou.' }
Invoke-RestMethod http://192.168.0.69:4301/health
```

Acessar http://192.168.0.69:4174. Liberar portas de teste no firewall apenas se necessario para a LAN. Nao usar Vite dev/preview para producao. Nao salvar processos de teste para boot antes de validar. Verificar health, login, permissoes e relatorios; escrita somente no banco isolado.

Encerrar apenas os processos de teste:

```powershell
pm2 delete controle-estoque-2026-api-teste controle-estoque-2026-web-teste
```
