# Perfis e permissões — 2026-10-05

Admin → Perfis e permissões (/admin/perfis) permite criar perfis e editar permissões por recurso. Consultar abre listas; cadastrar, editar e excluir são direitos independentes. Uma ação inclui consulta do mesmo recurso automaticamente.

Perfis iniciais: Administrador (protegido, acesso completo), Usuário (consultas e movimentação, preservando comportamento anterior) e Somente leitura (consultas sem alterações). Atribuição em Admin → Usuários e permissões. Harlem e MONICA continuam administradores; não existe promoção automática por nome.

API e interface verificam permissões. A API consulta perfil atual em cada requisição. Recarregue a página para atualizar menus após mudanças. Auditoria transacional de criação/edição em dbo.AccessProfileAudit, contendo ator, data e antes/depois, sem senhas. Edições concorrentes retornam 409. Atribuição de perfil impede rebaixar o último administrador ativo; isso não é uma revisão completa das demais operações de usuário.

Schema: back-end/sql/patch-access-profiles.sql; aplicação idempotente/aditiva validada com rollback e executada no SERVER-ABC. Nenhum usuário existente alterado pela migration. Em outra instalação, aplicar a migration antes de atualizar a API.

Validação: builds backend/frontend; npm run test:auth (68 requisições, inclui Somente leitura); npm run test:profiles (SQL em tabelas temporárias, auditoria, conflitos, admin protegido). Teste visual e atribuição real pelo usuário pendentes. Sem commit, push ou deploy IIS nesta etapa.
