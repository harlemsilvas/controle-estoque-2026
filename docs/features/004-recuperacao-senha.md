# Recuperacao de senha por e-mail

Implementada em 2026-10-06; entrega real pendente de configuracao SMTP. Login → Esqueci minha senha → e-mail → link → nova senha. Rotas publicas POST /recuperar-senha e POST /reset-password; /forcar-senha permanece bloqueada. O endpoint antigo sem token nao altera senhas.

Token assinado com chave derivada e diferente da chave de sessao, validade de 15 minutos e vinculo ao hash atual da senha. A atualizacao SQL compara atomicamente o hash anterior: reuso e duas confirmacoes simultaneas nao conseguem trocar a senha duas vezes. Troca administrativa tambem invalida links e JWTs anteriores. Conta inativa nao recebe link nem pode redefinir. Nao requer migration/tabela nova.

A resposta da solicitacao e generica para e-mails existentes ou inexistentes. Entrega SMTP em segundo plano, com falha registrada sem destinatario/token/credenciais. Limite de cinco solicitacoes por IP/e-mail em 15 minutos; confirmacoes limitadas por IP. Limitadores em memoria sao por processo, assim como a revogacao local ja existente: multiplas instancias exigem coordenacao futura.

Senha nova: pelo menos 12 caracteres e ate 72 bytes UTF-8, respeitando limite bcrypt. Link usa fragmento #token=, evitando envio do token no caminho/query HTTP; a tela remove o fragmento do endereco ao abrir. Nao permite login com token de recuperacao.

## SMTP externo — Hostinger

Nao precisa instalar servidor de e-mail no Linux. Usar as credenciais da caixa Hostinger no .env. Configuracao testada: smtp.hostinger.com, porta 465 (TLS); remetente MAIL_FROM deve corresponder a caixa SMTP_USER autorizada. O teste de envio foi aceito pelo servidor usando essa caixa como remetente. Porta 587 usa STARTTLS se adotada conforme configuracao do provedor. A senha SMTP permanece no .env, fora do Git; criptografia adicional ficou adiada por escolha do usuario.

Modelo sem segredos: back-end/.env.recovery.example. Preencher SMTP_USER, SMTP_PASSWORD, MAIL_FROM e APP_PUBLIC_URL. APP_PUBLIC_URL e a origem do frontend (sem caminho): https://estoque.seudominio, ou http://192.168.0.69:4174 para testes Windows. Para este ultimo usar ALLOW_HTTP_PASSWORD_RECOVERY=true explicitamente. Ativar PASSWORD_RECOVERY_ENABLED=true apenas depois de preencher os valores; reiniciar somente a API dessa instancia. URL deve ser acessivel a quem recebe o e-mail. Configuracao da instancia de testes nao atualiza automaticamente o .env da publicada.

Sem SMTP configurado, solicitacao responde 503 e oferece contato com administrador. Teste SMTP real enviado para o destinatario autorizado e aceito pelo servidor. Recebimento e fluxo completo de recuperacao ainda precisam ser confirmados pelo usuario.

Referencias: [SMTP MailerSend](https://www.mailersend.com/help/smtp-relay), [verificacao do dominio](https://www.mailersend.com/help/how-to-verify-and-authenticate-a-sending-domain), [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).

Testes: npm run test:recovery usa usuarios/atualizacao/e-mail simulados, sem banco/SMTP reais. Verifica expiracao, uso unico, concorrencia, conta inativa, troca administrativa, resposta generica, separacao da sessao, limites e rotas HTTP. Entrega/recebimento real e teste de ponta a ponta pelo usuario continuam pendentes.
