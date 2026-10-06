# Autenticação e autorização — prioridade atual

Data: 2026-10-05
Status: proteção por perfis e recuperação por token implementadas; regressão atual com 79 requisições HTTP. Configuração SMTP e validação manual pendentes.

## Achados anteriores à implementação

- A maioria das rotas em back-end/app.ts não utiliza authenticateToken, incluindo cadastros, relatórios, movimentações e administração de usuários. Associação de órfãos é a exceção protegida.
- /forcar-senha permite redefinir senha informando e-mail/senha sem exigir autenticação.
- /recuperar-senha também altera a senha com e-mail/newPassword, sem comprovar posse de token de recuperação.
- Login usa fallback de segredo e não verifica usuário inativo; middleware atual valida assinatura JWT, mas não consulta status/perfil atual no banco.
- AuthContext imprime tokens no console. Guardas de frontend não substituem proteção da API.

## Ordem de implementação

1. Bloquear força de senha e recuperação sem prova de identidade; definir recuperação por token de uso único sem importar automaticamente patches antigos.
2. Exigir JWT válido nas rotas privadas, mantendo login/health e somente os fluxos públicos necessários acessíveis.
3. Autorizar ações administrativas no backend pelo perfil atual e validar usuário ativo; alinhar matriz de leitura, movimentação e alteração de cadastros aos perfis.
4. Padronizar envio de credenciais no Axios/fetch e guardas no frontend, preservando relatórios, cadastro e associação em lote.
5. Remover logs sensíveis e fallback de segredo; validar carregamento do ambiente antes dos módulos, expiração e logout.
6. Testar sem sessão, token inválido/expirado, usuário desativado e perfil não administrativo; testar regressão dos fluxos existentes sem alterar dados reais.

## Limites

- Não migrar automaticamente os patches de segurança das referências locais.
- Não mudar banco de produção, senhas ou perfis durante revisão.
- Achados acima descrevem o estado anterior. Correções atuais estão registradas abaixo.

## Implementação em 2026-10-05

- Login e health públicos; recuperação antiga retorna 410; demais rotas exigem JWT HS256, expiração, identificador de sessão e vínculo à senha atual.
- Status/perfil consultados no banco por requisição. Leituras e movimentações liberadas a usuários ativos; mutações de cadastros, associação de órfãos, lixeira e administração de usuários exigem admin. Autor de movimentações obtido da sessão.
- /me sincroniza frontend; Axios/fetch enviam Bearer; guardas usam contexto autenticado. Logs de tokens removidos.
- Logout revoga jti até expiração em arquivo local logs/session-revocations.json (0600), persistindo em reinícios. Destinado a uma única instância; não é armazenamento distribuído.
- JWT_SECRET obrigatório (mínimo 32 caracteres), sem fallback. DB também exige variáveis explícitas. Ambiente carregado antes dos módulos.
- Limite de 10 tentativas de login em 15 minutos por IP; limite depende de TRUST_PROXY=1 apenas quando existe exatamente um proxy confiável. Não alterado ambiente IIS/produção.
- Teste: npm run test:auth no backend, com banco de leitura acessível e DB_SERVER ajustado ao ambiente. Usa usuários simulados, SELECTs reais e arquivo temporário; não grava usuários/cadastros.
- Recuperação automática por token de uso único continua pendente; para redefinir senha, usar administração de usuários.

Atualizacao 2026-10-06: autenticacao usa permissoes configuraveis por recurso/acao (as regras fixas admin acima sao historicas). Recuperacao implementada conforme 004-recuperacao-senha.md; SMTP ainda desativado sem configuracao. Protecao do ultimo administrador ativo cobre rebaixamento de perfil e desativacao de usuario; testes usam banco simulado. Validacao manual nao e substituida pelos testes automatizados.
