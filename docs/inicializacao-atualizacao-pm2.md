# Atualizacao e inicializacao com PM2

Roteiro preparado em 2026-10-07. Scripts criados e testados; alteracao da tarefa existente e troca de pastas ainda nao executadas. IIS fica fora deste fluxo.

## Atualizar e iniciar

`atualizar-iniciar.ps1` consulta origin/main, exige a main oficial e arquivos versionados sem alteracoes, instala dependencias backend/frontend e compila em um release separado. Usa VITE_API_BASE_URL com IP/porta da API, verifica configuracao/banco somente por leitura e troca apenas os dois nomes PM2 configurados. Nao executa migrations, envia e-mails, instala PM2 globalmente ou libera portas encerrando processos.

Se a rede, instalacao ou build falhar, inicia/preserva o ultimo release validado, quando existir. A primeira ativacao exige preparacao bem-sucedida. Se a nova versao falhar no health/frontend, restaura os dois processos anteriores. O backend le uma copia da configuracao local de back-end/.env no release; senhas nao sao exibidas. Alteracoes nesse arquivo exigem nova execucao do script. Logs e revogacoes ficam fora dos releases, em logs/. Releases antigos sao preservados; nao ha exclusao automatica.

O script instala dependencias com npm ci --include=dev --ignore-scripts nos dois componentes em cada execucao e remove dependencias de desenvolvimento do backend de runtime. Scripts de instalacao npm nao sao executados automaticamente; se uma dependencia futura exigir isso, revisar antes de habilitar. Requer Node 22.16+ com --use-system-ca, Git, npm e PM2 previamente instalados. Nao desabilita TLS.

Use PowerShell administrador ou a conta SYSTEM existente. Nao iniciar outro daemon PM2 concorrente: no Windows os pipes sao fixos. O script nao depende de pm2 resurrect nem pm2 save.

### Preparar sem alterar processos ou fontes

```powershell
Set-Location C:\controle-estoque-2026
.\atualizar-iniciar.ps1 -Preparar -SemAtualizacao -BackendPort 4301 -FrontendPort 4174
```

Esse modo compila o commit HEAD, nao alteracoes locais ainda nao commitadas. Tambem verifica o banco configurado, somente com SELECT. O preparo real foi aprovado nesta maquina em 2026-10-07 para o commit 1883bf1.

### Atualizar a instancia de teste

Salvar/enviar os arquivos versionados pendentes antes: o modo operacional recusa alteracoes locais e divergencia com origin/main. Nao usar git reset --hard nem git add . para contornar. Os scripts desta tarefa ainda precisam ser revisados e salvos no Git antes de ativar a atualizacao automatica.

```powershell
.\atualizar-iniciar.ps1 -BackendPort 4301 -FrontendPort 4174 `
  -BackendName controle-estoque-2026-api-teste `
  -FrontendName controle-estoque-2026-web-teste `
  -Pm2Home C:\controle-estoque\deploy\production\.pm2
```

### Producao, apos migracao aprovada

```powershell
Set-Location C:\controle-estoque
.\atualizar-iniciar.ps1
```

Portas padrao: API 4300, frontend 4173. Nomes: controle-estoque-backend/frontend. Ajustar APP_PUBLIC_URL no back-end/.env para o endereco final antes de testar a recuperacao SMTP; o script nao altera essa configuracao. URL: http://192.168.0.69:4173. Para mudar o IP, use -ApiHost. Confirmacao: logs/startup/status.txt e logs/startup/active-release.json. Os arquivos nao contem credenciais. O estado so e aceito depois de health e frontend retornarem 200. Fonte Git pode avancar mesmo se o runtime precisar voltar a versao anterior; o status registra essa falha.

## Atualizar a tarefa existente no Windows

O usuario informou que a tarefa de inicializacao ja existe. Reutilizar essa tarefa: nenhuma segunda tarefa sera criada. O script atualizar-tarefa-inicializacao.ps1 agora so altera a acao da tarefa selecionada, preservando gatilho, usuario e configuracoes. O nome padrao nos scripts anteriores e ControleEstoqueStack; usar -TaskName se o nome for outro, com prefixo ControleEstoque.

Somente depois de validar o release nas portas 4300/4173 e confirmar o caminho final:

```powershell
.\atualizar-tarefa-inicializacao.ps1 -TaskName ControleEstoqueStack
```

A conta da tarefa precisa de acesso ao repositorio, rede e ferramentas. Em repositorio privado, SYSTEM pode nao ter as credenciais Git do usuario; configurar esse acesso pela operacao, sem tokens no script. O ultimo release validado permite iniciar a versao anterior se a consulta ao GitHub falhar. A tarefa existente nao foi alterada nesta implementacao. Se for desabilitada temporariamente para mover pastas, reabilitar somente depois da nova acao e dos caminhos finais validados.

## Trocar as pastas

Sim, a estrutura final pode ser C:\controle-estoque (nova versao) e C:\controle-estoque-backup (versao anterior). A troca implica indisponibilidade e deve ser uma etapa separada, depois de validar a instancia de teste e salvar as correcoes no Git.

1. Confirmar que o backup nao existe e que os unicos processos do daemon sao as duas instancias conhecidas de estoque. Se houver outros aplicativos PM2, interromper a migracao e planejar sem encerrar o daemon compartilhado.
2. Registrar o estado das tarefas atuais e desabilitar as de boot antigas durante a troca. Preservar configuracao e revogacoes da versao publicada, sem exibir conteudos. Banco permanece compartilhado; a troca nao faz copia ou migration do banco.
3. Em PowerShell administrador, com PM2_HOME antigo, parar os quatro nomes especificos de producao/teste. Encerrar o daemon somente se confirmado que nao gerencia outros aplicativos. Nao mover pastas enquanto Node/PM2 ainda as utiliza.
4. Sair da pasta atual para C:\. Verificar os caminhos absolutos exatos antes de mover:

```powershell
Set-Location C:\
if (Test-Path -LiteralPath C:\controle-estoque-backup) { throw 'Backup ja existe; nao sobrescrever.' }
Move-Item -LiteralPath C:\controle-estoque -Destination C:\controle-estoque-backup
Move-Item -LiteralPath C:\controle-estoque-2026 -Destination C:\controle-estoque
```

5. Executar atualizar-iniciar.ps1 no caminho final. O script calcula os caminhos de release a partir da propria pasta. Nao usar configs/dumps antigos com caminhos apontando para controle-estoque-2026 ou backup.
6. Validar health, login, Produtos, relatorios CSV e recuperacao SMTP. Atualizar a acao da tarefa existente so depois dessa validacao. Guardar a pasta backup para restauracao, sem rodar as duas versoes na mesma porta.

A renomeacao nao foi executada. Nao ligar o computador com tarefas antigas apontando para pastas renomeadas antes de concluir a troca. HTTP pela LAN nao cifra senhas/tokens; usar apenas rede confiavel enquanto HTTPS nao estiver configurado.

## Testes locais

`node tests/test-startup.cjs`: PM2 simulado (consulta sem segredos, preservacao, troca e restauracao apos falha) e servidor estatico em porta temporaria (SPA/assets/404/travessia). Sintaxe PowerShell e Node validada. Preparacao real inclui npm ci dos dois componentes, builds e preflight de leitura; nao houve ativacao PM2 nesta tarefa.


