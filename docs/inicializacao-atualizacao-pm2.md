# Inicializacao e atualizacao com PM2

A producao permanece em C:\controle-estoque-2026, por escolha do usuario. C:\controle-estoque permanece preservada com o runtime anterior e o PM2_HOME existente. IIS nao participa deste fluxo.

## Atualizar e iniciar

Em PowerShell com acesso ao daemon PM2 existente:

```powershell
Set-Location C:\controle-estoque-2026
.\atualizar-iniciar.ps1 -Pm2Home C:\controle-estoque\deploy\production\.pm2
```

O roteiro consulta origin/main, exige main oficial e arquivos versionados sem alteracoes, instala dependencias do backend e frontend com npm ci, compila em release separado e verifica o banco somente por leitura. Usa as portas 4300/4173 e substitui somente controle-estoque-backend/frontend. Endereco: http://192.168.0.69:4173. Para mudar o IP, informar -ApiHost; APP_PUBLIC_URL do runtime acompanha esse endereco.

A configuracao local back-end/.env e copiada sem exibir seu conteudo. Nenhuma migration e executada. Falhas de rede/build preservam o ultimo release validado; falhas de inicializacao restauram os processos anteriores. Releases e logs ficam fora do Git. O estado confirmado fica em logs/startup/active-release.json; logs/startup/status.txt informa a etapa.

Requer Node 22.16+, Git, npm e PM2 instalados. Nao desabilita TLS; usa --use-system-ca. npm ci usa --ignore-scripts e o backend final remove dependencias de desenvolvimento. Nao iniciar daemon concorrente: Windows usa pipes PM2 fixos. Nao depende de pm2 save/resurrect.

## Tarefa existente

A tarefa ControleEstoqueStack conserva conta, senha Windows armazenada, gatilhos e acao. O arquivo startup-bootstrap.ps1 que ela ja executa passa a chamar o atualizador nesta pasta, com o PM2_HOME existente. O bootstrap anterior e preservado em .before-automation.bak. Nenhuma tarefa adicional e criada.

Depois de validar a producao, a atualizacao do bootstrap pode ser repetida em PowerShell administrador:

```powershell
.\atualizar-tarefa-inicializacao.ps1 -TaskName ControleEstoqueStack
```

A conta da tarefa precisa de acesso ao GitHub, ferramentas e PM2. O ultimo release validado permite iniciar mesmo se a atualizacao falhar. Em operacoes manuais, usar a mesma permissao da sessao PM2; o roteiro verifica acesso efetivo sem exigir administrador em todo boot.

## Preparacao e verificacoes

```powershell
.\atualizar-iniciar.ps1 -Preparar -SemAtualizacao
node tests/test-startup.cjs
```

Preparar compila HEAD em release separado e nao altera processos nem fontes. Testes verificam troca/restauracao PM2 simulado e servidor HTTP temporario. A preparacao real de dd60e8a nesta maquina aprovou instalacao, builds dos dois componentes e preflight de leitura. Login, Produtos, CSV e recuperacao SMTP devem ser conferidos no navegador; essas verificacoes manuais nao sao substituidas pelo health.
