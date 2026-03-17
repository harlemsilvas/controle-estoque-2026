# Migração para TypeScript

## Scripts

- `npm run dev` — Executa a API em modo desenvolvimento (ts-node)
- `npm run build` — Compila para JavaScript em `dist/`
- `npm start` — Executa a versão compilada

## Estrutura

- Todos os arquivos `.js` devem ser migrados para `.ts`.
- Ajuste imports/exports para ESModules se necessário.
- Utilize tipagem forte em controllers, services, models e middlewares.

## Dicas

- Use `any` apenas como último recurso.
- Tipos de dados do banco podem ser definidos em `types/`.
- Após migrar cada arquivo, remova o `.js` correspondente.
