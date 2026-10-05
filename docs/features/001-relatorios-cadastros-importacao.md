# Relatórios de cadastros e correções por planilha

Data: 2026-10-05
Status: backlog, sem urgência. Implementar depois de autenticação/autorização.

## Objetivo

Relatórios práticos de produtos, fornecedores, marcas e famílias, com filtros simples e exportação CSV/XLSX. Os relatórios agrupados atuais resumem estoque; esta feature lista os registros de cadastro para consulta e correção.

## Escopo inicial

- Produtos: código, descrição, códigos interno/barras, fornecedor, marca, família, valor e estoque mínimo. Estoque atual pode ser consultado/exportado, mas não será corrigido pela importação de cadastro.
- Fornecedores: código, nome, CNPJ, telefone, e-mail e endereço.
- Marcas e famílias: código e descrição.
- Busca por código/nome, filtros pertinentes ao cadastro e exportação de todos os resultados filtrados, sem depender da página exibida.
- CSV para uso simples; XLSX em etapa seguinte. Exportações devem preservar códigos, zeros à esquerda e textos, com proteção contra fórmulas.

## Importação de correções

- Começar por atualização de registros existentes, identificados pelo código estável do banco. Não recriar cadastros nem alterar códigos.
- Upload → validação → prévia das diferenças e erros por linha/campo → confirmação → aplicação → resumo e arquivo de erros.
- Rejeitar códigos inexistentes/duplicados, campos inválidos e vínculos inexistentes. Não criar fornecedor/marca/família implicitamente.
- Não alterar estoque atual, movimentações, usuários, senhas, permissões ou excluir registros por planilha.
- Preservar um fornecedor por produto. Nesta feature, troca de fornecedor existente exige confirmação explícita na prévia; associação de órfãos continua disponível no fluxo atual.
- Importação permitida apenas a perfil autorizado, com limites de arquivo/linhas definidos antes da implementação e verificação de mudanças concorrentes.

## Auditoria

- Registrar usuário, data, arquivo/lote, código do registro, campos alterados, valores anteriores/novos e resultado.
- Erros de validação/aplicação vinculados ao lote e à linha, sem registrar segredos. Disponibilizar resumo e arquivo de erros ao usuário autorizado.
- Definir retenção/acesso à auditoria e política de aplicação/rollback antes da etapa de gravação; não escolher silenciosamente sucesso parcial.

## Etapas

1. Relatórios de cadastros + CSV.
2. Exportação XLSX.
3. Prévia de correções sem gravação.
4. Aplicação autorizada com auditoria e tratamento de conflitos.

## Aceite

- Filtros e colunas da tela correspondem à exportação completa.
- Cancelar prévia não modifica o banco; arquivo inválido não provoca gravação silenciosa.
- Cada alteração aplicada tem usuário e valores antes/depois rastreáveis.
- Erros apresentam código, linha/campo e motivo; não alteram dados fora do escopo.

Nenhuma alteração de schema ou importação foi executada na especificação desta feature.
