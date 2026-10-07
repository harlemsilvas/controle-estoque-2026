# Continuidade — controle-estoque-2026

TAG: RETOMADA-20261005-COMMIT-IIS
Data: 2026-10-05
Base oficial: /home/harlem/projetos/controle-estoque-2026; preservar alterações locais não commitadas.

Estado confirmado:
- Cadastros/associação de fornecedores (individual/lote), cadastro rápido de marcas/famílias, relatório de movimentações e relatórios agrupados implementados.
- Autenticação JWT com usuário/status/perfil atual, expiração, invalidação por senha e logout com revogação persistida. Recuperação pública antiga bloqueada; recuperação por token ainda pendente.
- Harlem (id 1) e MONICA (id 2) são administradores, por autorização explícita anterior. Não promover contas automaticamente por nome.
- Admin → Perfis e permissões permite criar/editar recursos e ações; Admin → Usuários atribui perfil. Administrador protegido, Usuário padrão e Somente leitura disponíveis.
- Migration de duas tabelas AccessProfiles/AccessProfileAudit aplicada no SERVER-ABC com idempotência/rollback testados e roles existentes preservadas.
- Frontend oculta menus sem direitos e bloqueia ações; API valida direitos atuais a cada chamada. Auditoria transacional de criação/edição e versão para conflitos.
- Builds backend/frontend e 68 verificações HTTP aprovados. Serviço de perfis/auditoria testado em tabelas temporárias, sem alterações de cadastros reais.

Próxima retomada: informar esta TAG, conferir estado dos serviços locais e alterações Git. Validar a tela e atribuição real de Somente leitura no navegador; continuar tarefas.todo. Não houve commit/push/deploy IIS nesta etapa.

Ambiente: SQL Server SERVER-ABC = 192.168.0.69:1433. DNS curto pode não resolver; testes locais usam DB_SERVER=192.168.0.69. Não imprimir .env/senhas/tokens. Backups/referências locais ignorados pelo Git. Arquivo anterior de continuidade, que continha JSX, preservado em logs/continuidade-anterior-20261005.txt.

Validação local final: backend reiniciado; /health 200, /perfis sem sessão 401, consulta autenticada dos perfis aprovada. Harlem e MONICA confirmados administradores ativos.

### Correção das totalizações — 2026-10-05
- Telas existentes por marca/fornecedor/família esperavam campos com nomes diferentes da API (ValorTotal vs valor_total), impedindo a renderização.
- Componente compartilhado usa campos corretos, BRL, estados de carregamento/erro/lista vazia e total dos grupos exibidos. API e cálculos SQL preservados.
- Admin → Totalização do estoque agora expõe diretamente as três telas e visão geral. Permissões existentes preservadas.
- Validação visual pelo usuário pendente. Sem migration, commit ou deploy.

### Preparacao de commit e deploy IIS — 2026-10-05
- Usuario confirmou relatorios e autorizou commit/push.
- Revisado prepare-deploy-iis.ps1: preserva .env/web.config/logs, nao encerra Node indiscriminadamente, instala dependencias, valida banco/configuracao e compila frontend com /api.
- DEPLOY-IIS.md corrige proxy para retirar /api e explicita porta PM2 4300 vs fallback Node 3000, parada/reinicio e mesma conta PM2.
- Preflight check-deploy.cjs somente le banco. Banco atualizado vale para IIS apenas se DB_SERVER + DB_NAME forem os mesmos.
- Deploy Windows nao executado; validar no servidor.
- Preflight validou banco compartilhado e build IIS com /api aprovado no Linux. Runtime deploy/production/backend e PM2 ignorados; manifests gerados deixam de ser versionados para evitar conflitos em futuras atualizacoes.

- Regressao final: 68 verificacoes HTTP com perfis isolados e controllers de escrita bloqueados; servico de perfis em tabelas temporarias aprovado.
- O teste legado dependia do perfil readonly real editado pelo usuario e acionou restauracao de CODIGO=1. Alteracao revertida explicitamente (DELETADO=1, uma linha); nao repetir testes sem isolamento. Perfis reais preservados.
- Banco validado, builds backend/frontend com /api e diff check aprovados; preparado commit em main para envio ao origin.

### Verificacao atual Windows e compilacao local — 2026-10-06
TAG: RETOMADA-20261006-BUILD-LOCAL-WINDOWS
- Lidos CODEX_CONTINUITY.md, DEPLOY-IIS.md, README.md, DEPLOY-MANUAL.md, docs/producao-windows.md, manifests e script prepare-deploy-iis.ps1. Para IIS, seguir DEPLOY-IIS.md revisado em 2026-10-05; documentos antigos divergem sobre portas, base da API e prepare-deploy.ps1.
- Git nao reconheceu C:\controle-estoque-2026 como repositorio; correspondencia com main e alteracoes locais nao puderam ser verificadas. Nenhum fonte ou lockfile foi editado intencionalmente.
- Node v22.16.0. Backend: npm run build aprovado (tsc, exit 0); artefato back-end/dist/app.js confirmado.
- Frontend: dependencias locais inicialmente incompletas (atalho vite ausente e binding SWC indisponivel). npm ci --include=dev --no-audit --no-fund concluido fora do sandbox apos EPERM; 360 pacotes instalados.
- Frontend: npm run build com VITE_API_BASE_URL=/api aprovado no Windows (exit 0, 1590 modulos). Artefatos em front-end/dist. Variavel de ambiente anterior restaurada. Avisos de Browserslist antigo, importacao estatica/dinamica e bundle acima de 500 kB nao impediram o build.
- Esta verificacao confirma compilacao local, nao testes funcionais ou deploy. Nenhum banco foi consultado/alterado, nenhuma migration/deploy executada e nenhum servico reiniciado.
- Pendencias: confirmar clone/main oficial antes da publicacao, validar configuracao e banco de producao com preflight autorizado, preservar configuracao/runtime, publicar e validar health/login/permissoes/relatorios no IIS quando solicitado. Validacao visual historica ainda pendente.

### Auditoria npm e preparacao PM2/IP — 2026-10-06
TAG: RETOMADA-20261006-NPM-PM2-IP
- Usuario esclareceu: C:\controle-estoque e a versao publicada; C:\controle-estoque-2026 e a nova versao, separada para testes. IIS desconsiderado por enquanto; fluxo PM2 e acesso direto por IP.
- Git da nova pasta continua sem repositorio. Git da antiga consultado: alteracoes locais em dump.pm2, register-startup-tasks.ps1 e estoque.bat, preservadas. Apenas configuracao PM2 consultada; nenhum segredo lido/impresso.
- Auditoria atual npm: frontend 25 -> 7 alertas, zero em producao; backend e raiz 15 -> 6 cada, com 3 moderados em producao na mesma cadeia mssql/tedious/sprintf-js. Sem criticos/altos de producao. Detalhes e pendencias em docs/auditoria-npm-20261006.md.
- Aplicadas correcoes compativeis e atualizados manifests/lockfiles: axios, react-router-dom, Vite, PostCSS, typescript-eslint e override qs. Sem --force/downgrades. Copias locais anteriores e JSONs em .codex/npm-security-20261006.
- Builds backend/frontend e verificacoes npm ls aprovados apos correcoes. Build frontend agora aponta para http://192.168.0.69:4301, nao /api. IP local confirmado nesta verificacao.
- docs/teste-pm2-ip.md prepara portas 4301/4174 e nomes distintos para nova versao. Antiga configuracao usa 4300/4173. Roteiro nao executado; nenhuma instancia PM2 iniciada, deploy/migration ou banco alterado.
- Pendencias: braces/sprintf-js sem patch publicado; Tailwind 3 tem cadeia de desenvolvimento com alertas, migracao principal precisa validacao visual; validar funcionalmente PM2/IP quando solicitado. Separar banco de teste antes de operacoes de escrita: portas/pastas distintas nao isolam dados. Registros IIS anteriores sao historicos, nao o fluxo atual.

### Diagnostico de conexao recusada — 2026-10-06
TAG: RETOMADA-20261006-PM2-CONEXAO
- Portas confirmadas: versao publicada ouvindo 4300/4173; nova versao sem listeners 4301/4174. Localhost sem porta nao aponta para o frontend PM2.
- Tentativa de iniciar somente frontend no PM2 existente falhou com connect EPERM //./pipe/rpc.sock. Nenhuma nova instancia confirmada; processos publicados continuam ativos. Nao criar daemon alternativo nem encerrar processos antigos.
- Usuario autorizou usar banco da versao publicada. Copiada configuracao deploy/production/backend/.env da pasta antiga para back-end/.env desta copia, somente porque destino nao existia; conteudo nao exibido/registrado. PORT=4301 sera fornecido pelo PM2, sobrepondo valor do arquivo.
- Criado iniciar-teste-pm2.ps1 com nomes separados, portas 4301/4174, mesmo PM2_HOME, preservacao de variaveis e verificacoes HTTP. Sintaxe validada; execucao operacional pendente na mesma conta/permissao elevada que controla PM2.
- Nenhum deploy/migration ou escrita no banco executados. Banco compartilhado por escolha explicita: operacoes de escrita na nova versao atingem dados publicados.

### Correcao da elevacao PM2 no Windows — 2026-10-06
TAG: RETOMADA-20261006-PM2-ELEVACAO
- Verificacao atual: sessao Harlem nao elevada; script de startup publicado configura SYSTEM. Proprietario dos processos publicados nao pode ser confirmado por esta sessao.
- Codigo local PM2 paths.js confirma pipes fixos rpc.sock/pub.sock no Windows, mesmo ao alterar PM2_HOME. Nao alterar PM2 global nem criar outro daemon.
- iniciar-teste-pm2.ps1 agora solicita elevacao UAC com RunAs antes de qualquer chamada PM2, usando janela oculta; detecta elevacao negada. Sintaxe validada. Confirmacao operacional depende de UAC e verificacao HTTP; nao confundir script preparado com servicos iniciados.

### Validacao operacional PM2/IP concluida — 2026-10-06
TAG: RETOMADA-20261006-PM2-TESTE-ATIVO
- Inicializacao elevada UAC aprovada e executada. Corrigidas consultas de instancias ausentes e incompatibilidade JSON/PowerShell; consulta via API local PM2 retorna apenas nomes, sem imprimir ambiente/segredos.
- Novos processos de teste iniciados no PM2 existente, nomes controle-estoque-2026-api-teste e controle-estoque-2026-web-teste. Status seguro em pm2-teste-status.txt: API/frontend HTTP 200.
- Verificacao atual: frontend http://192.168.0.69:4174 e API http://192.168.0.69:4301/health retornam 200. Versao publicada 4173 e 4300/health tambem retorna 200; preservada.
- Sintaxe final do script validada. Nao executado pm2 save, migrations ou deploy da versao publicada. Banco compartilhado por autorizacao explicita; login/permissoes/relatorios ainda precisam de validacao funcional. Nao executar testes de escrita automatizados no banco compartilhado.

### Correcao Cadastro > Produtos — 2026-10-06
TAG: RETOMADA-20261006-PRODUTOS-TABELA
- Usuario validou demais telas e informou falha apenas na consulta Cadastro > Produtos.
- Causa confirmada no fonte: useAuth/can declarado dentro de renderSortIcon em ProdutosTable.jsx; botoes de editar/excluir usam can fora desse escopo e falham ao renderizar produtos. Hook movido para o corpo do componente; regras de permissoes preservadas.
- Teste de renderizacao React com dados ficticios aprovado: carregamento, vazio, lista com permissoes negadas (dois botoes desabilitados) e permitidas. Nenhum banco acessado pelo teste. Script local em .codex/test-products-table.cjs.
- Build frontend com API http://192.168.0.69:4301 aprovado. Frontend PM2 4174 entrega index e novo bundle index-E1HLaYaW.js com HTTP 200; sem reiniciar servicos.
- Nenhuma alteracao na API, versao publicada ou banco. Validacao visual da consulta corrigida ainda depende de recarregar o navegador. Git nesta copia segue indisponivel (nao e repositorio).

### Sincronizacao das correcoes com GitHub — 2026-10-06
TAG: RETOMADA-20261006-GIT-CORRECOES
- Repositorio oficial consultado: https://github.com/harlemsilvas/controle-estoque-2026, main no commit d2570f5 antes desta sincronizacao.
- Nova pasta local nao possui .git. Criado clone separado em .codex/repo-sync para preservar runtime e arquivos em uso. Comparacao normalizada confirmou base main; diferencas materiais limitadas aos pacotes, ProdutosTable e continuidade.
- Preparado commit com correcoes npm, hook de permissoes da tabela, teste de regressao versionado em tests/test-products-table.cjs, roteiro PM2 e documentacao. Definidas versoes minimas corrigidas axios/react-router-dom/Vite no manifesto, mantendo lockfiles coerentes.
- Estado PM2 dump.pm2 retirado do indice, sem apagar runtime original. .codex e pm2-teste-status.txt ignorados. .env, node_modules e builds fora do commit. Historico remoto nao reescrito.
- Teste de renderizacao aprovado novamente; sintaxe PowerShell e git diff --check aprovados. Builds e verificacoes HTTP anteriores permanecem validacoes historicas desta sessao; nenhum deploy/migration executado nesta sincronizacao.
- Envio deste commit e confirmacao do hash remoto serao feitos apos gravar este registro.

### Recuperacao por e-mail e relatorios de cadastros — 2026-10-06
TAG: RETOMADA-20261006-RECUPERACAO-CADASTROS
- Usuario autorizou seguir sequencia de seguranca, recuperacao e relatorios CSV. SMTP inicialmente interno, depois sugeriu MailerSend; implementacao aceita SMTP externo.
- Recuperacao de 15 minutos, chave distinta da sessao, vinculo ao hash da senha e atualizacao atomica para impedir reuso/concorrencia, sem migration. Resposta generica e limitadores; SMTP desativado ate configurar .env. Modelo sem credenciais em back-end/.env.recovery.example.
- Nenhum e-mail enviado ou senha real alterada. Entrega real pendente de dominio/remetente/credenciais/URL no MailerSend. Nao pedir senhas no chat.
- Ultimo administrador ativo protegido contra desativacao e rebaixamento, validado em banco simulado.
- Relatorios → Cadastros · CSV: produtos/fornecedores/marcas/familias, busca/paginacao e filtros de produto. Exportacao completa ate 10.000, protegendo formulas/codigos de texto. Exige reports.read + consulta do cadastro, somente SELECT.
- Builds backend/frontend e testes de recuperacao, administrador, CSV aprovados. Regressao de 79 requisicoes com perfis simulados, controllers de escrita bloqueados e consultas reais aprovada. Cadastros/banco de producao preservados.
- Testes visuais/manuais permanecem pendentes; nao marcar checks automaticamente. XLSX/importacao continuam backlog. Sem commit/push ou deploy Windows nesta etapa.

- Validacao local final: backend atualizado na porta 3000, /health 200, relatorio de cadastros sem sessao 401 e recuperacao sem SMTP configurado 503. Windows preservado. MailerSend confirmado compativel via SMTP 587/STARTTLS; dominio e credenciais ainda pendentes.

### Commit para teste Windows — 2026-10-06
TAG: RETOMADA-20261006-RECUPERACAO-COMMIT
- Usuario optou pela Hostinger, sem MailerSend. SMTP configurado localmente, TLS/autenticacao aprovados; mensagem aceita para destinatario autorizado quando remetente corresponde a caixa SMTP. Remetente divergente foi recusado com 553.
- Modelo de recuperacao atualizado para Hostinger 465; senha em .env restrito/ignorado, criptografia adicional adiada pelo usuario. Nunca publicar credenciais.
- Usuario autorizou commit para testar no Windows. Configuracao SMTP nao acompanha git pull: preencher .env da instancia Windows e reiniciar API de testes. Sem migration nova e sem publicacao Windows nesta etapa.
- Para atualizar a instancia de testes: git pull --ff-only origin main; npm ci em back-end/front-end; build backend; build frontend com VITE_API_BASE_URL=http://192.168.0.69:4301; reiniciar somente controle-estoque-2026-api-teste no PM2 existente. Frontend serve dist na porta 4174. Usar conta/PM2_HOME existentes; preservar 4300/4173.
- Verificar cadastro CSV e fluxo de recuperacao real no navegador. APP_PUBLIC_URL deve corresponder ao frontend acessivel da instancia; SMTP_HOST/PORT/USER/PASSWORD/MAIL_FROM devem ser configurados no Windows, sem copiar automaticamente .env Linux.

### Confirmacao local preservada da sessao anterior (historico)
Confirmacao atual do envio: commit 55ce2bf8220c76fa62b628ad13a8df8727a22dfc enviado a origin/main; git ls-remote confirmou o mesmo hash. Clone .codex/repo-sync sem alteracoes pendentes. Esta confirmacao posterior ao push permanece no registro local; o registro preparado antes do envio foi incluido no commit.

### Reconstrucao Git e atualizacao local — 2026-10-07
TAG: RETOMADA-20261007-GIT-RECONSTRUIDO
- Usuario solicitou aplicar atualizacao feita em outro computador e reconstruir .git confiavel nesta pasta.
- .git ausente reconstruido com metadados do clone oficial .codex/repo-sync; origem https://github.com/harlemsilvas/controle-estoque-2026.git. Historico verificado; main atualizada por fast-forward de 55ce2bf para 1883bf1 (recuperacao SMTP e relatorios de cadastros CSV).
- Indice renormalizado para arquivos LF; core.autocrlf=input apenas neste repositorio. Conteudo local coincidia com a base, exceto confirmacao posterior ao push em CODEX_CONTINUITY.md. Registro preservado acima, em backup .codex/git-recovery-20261007 e stash nomeado. Nenhuma alteracao local descartada.
- .env, dependencias, builds e runtime preservados; pasta C:\controle-estoque nao alterada. Nenhum deploy, migration, envio de e-mail ou reinicio PM2 realizado nesta atualizacao. Serviços podem continuar executando a compilacao anterior.
- Pendencias: instalar nova dependencia SMTP/backend e compilar/testar quando solicitado; configurar SMTP e APP_PUBLIC_URL no .env Windows sem compartilhar segredos; validar recuperacao e CSV no navegador. Checks atuais desta etapa sao integridade Git, origem/branch/hash e protecao dos arquivos locais; builds/testes de outras maquinas sao historicos.

### Automacao de atualizacao e inicializacao PM2 — 2026-10-07
TAG: RETOMADA-20261007-STARTUP-AUTOMATICO
- Usuario solicitou script de atualizacao Git, dependencias frontend/backend, recompilacao e PM2; sugeriu renomear pasta antiga para controle-estoque-backup e nova para controle-estoque. Renomeacao nao executada; roteiro concreto em docs/inicializacao-atualizacao-pm2.md.
- Usuario solicitou excluir .env_estoque: arquivo removido por caminho literal validado, sem leitura/registro do conteudo. back-end/.env preservado. Adicionada protecao .env_* no ignore.
- Criado atualizar-iniciar.ps1: main/origin oficiais, fast-forward e guarda de alteracoes locais; npm ci dos dois componentes em releases separados, builds, preflight somente leitura, PM2 restrito aos dois nomes, health/frontend, versao anterior em falhas. Modo -Preparar nao altera PM2/fontes; -SemAtualizacao usa HEAD.
- Preparacao real aprovada para 1883bf1, portas 4301/4174: dependencias, builds e preflight do banco concluido. Release isolado em deploy/production/releases/1883bf1f79b6-3c37924b. Nenhuma migration, e-mail ou escrita em cadastros realizada.
- Usuario informou que tarefa de boot ja existe. Criado atualizar-tarefa-inicializacao.ps1 para alterar somente a acao da tarefa existente (padrao ControleEstoqueStack), preservando usuario/gatilhos/configuracoes. Nao foi criada/alterada tarefa nesta etapa.
- Helpers scripts/pm2-control.cjs e scripts/serve-site.cjs; tests/test-startup.cjs aprovado com PM2 simulado (consulta sem segredos, preservacao online, troca e rollback) e HTTP temporario (SPA/assets/404/travessia). Sintaxe PowerShell/Node validada. Releases/logs/configuracoes locais ignorados.
- Pendencias: revisar/salvar os scripts no Git antes de ativar atualizacao operacional (recusa arquivos versionados alterados); validar troca de runtime em PM2; decidir/executar troca de pastas com parada dos processos e atualizacao da tarefa no caminho final. Nada foi publicado no GitHub nesta etapa. Tarefa antiga e instancias em execucao preservadas.
