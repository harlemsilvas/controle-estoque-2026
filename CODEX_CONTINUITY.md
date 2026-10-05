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
