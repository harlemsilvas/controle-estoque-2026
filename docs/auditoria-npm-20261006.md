# Auditoria npm — 2026-10-06

Verificacao atual da nova versao em C:\controle-estoque-2026. Auditados frontend, backend e manifesto legado da raiz, incluindo dependencias de desenvolvimento e auditoria com --omit=dev. A versao publicada C:\controle-estoque foi consultada somente para Git e configuracao PM2; nenhuma alteracao nela.

| Componente | Antes (total) | Depois (total) | Depois em producao |
| --- | --- | --- | --- |
| Frontend | 25 (1 critico, 19 altos, 5 moderados) | 7 (5 altos, 2 moderados) | 0 |
| Backend | 15 (11 altos, 4 moderados) | 6 (3 altos, 3 moderados) | 3 moderados |
| Raiz legada | 15 (11 altos, 4 moderados) | 6 (3 altos, 3 moderados) | 3 moderados |

Contagens sao de pacotes afetados, incluindo propagacao transitiva; nao representam falhas independentes. Os tres alertas moderados de producao correspondem a uma cadeia: mssql -> tedious -> sprintf-js.

Correcoes: npm audit fix sem --force no frontend/backend; PostCSS 8.4.31 -> 8.5.29; axios 1.13.6 -> 1.20.0; react-router-dom 7.13.1 -> 7.18.4; Vite 6.4.1 -> 6.4.4. Backend e raiz: typescript-eslint 8.44.0 -> 8.71.1 e override qs 6.16.0. Manifests e lockfiles atualizados. Nao houve downgrade de mssql/nodemon nem migracao ampla de Tailwind.

## Pendencias de dependencias

- braces: sem versao corrigida publicada; presente no nodemon/chokidar (backend/raiz) e Tailwind 3/chokidar/fast-glob/micromatch (frontend). Ferramentas de desenvolvimento, nao runtime PM2. Nao fornecer padroes glob nao confiaveis a essas ferramentas. Referencia: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
- postcss-selector-parser/postcss-nested: alertas moderados na cadeia do Tailwind 3. A solucao automatica proposta exige Tailwind 4, mudanca principal com impacto em configuracao/CSS. Migracao e validacao visual ainda pendentes.
- sprintf-js: sem versao corrigida publicada no advisory. Os usos encontrados no tedious usam formatos constantes, sem precisao fornecida pelo usuario; isso reduz a exposicao ao mecanismo descrito, mas nao elimina o alerta. Nao foi testado contra SQL Server nesta revisao. Nao aplicar o downgrade sugerido para mssql 4.2.0. Referencia: https://github.com/advisories/GHSA-hp3w-g68c-fv3c

## Validacao

Backend npm run build e npm ls --omit=dev --depth=0 aprovados. Frontend npm run build e npm ls --depth=0 aprovados. Build frontend configurado para http://192.168.0.69:4301; substitui o build anterior para IIS com /api. Avisos de bundle grande/importacao estatica e dinamica continuam, sem erro de build.

TLS da consulta npm: usado --use-system-ca com certificados do Windows, sem desabilitar verificacao TLS. Instalacoes de correcao usaram --ignore-scripts. Relatorios JSON completos e copias dos manifests/locks anteriores ficam em .codex/npm-security-20261006; preservar localmente e nao publicar como artefatos do site.

Auditoria de pacotes e compilacao nao equivalem a teste funcional ou auditoria completa do codigo. Nenhum servico iniciado/reiniciado, migration/deploy ou escrita no banco executados. Seguir teste-pm2-ip.md para teste paralelo quando autorizado; portas diferentes nao isolam dados.
