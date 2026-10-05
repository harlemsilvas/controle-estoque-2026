import { Request } from 'express';
export function requiredPermission(req: Pick<Request,'path'|'method'>): string | null {
  const path = req.path, method = req.method;
  const action = ['GET','HEAD'].includes(method) ? 'read' : method === 'POST' ? 'create' : method === 'DELETE' ? 'delete' : 'edit';
  if (/^\/usuarios(?:\/|$)/.test(path)) return `users.${action}`;
  if (/^\/perfis(?:\/|$)/.test(path)) return `profiles.${action}`;
  if (['/estoque/movimentar','/estoque/movimentacao'].includes(path)) return 'stock.move';
  if (/^\/produtos\/restaurar/.test(path)) return 'trash.restore';
  if (/^\/(produtos|produto)\/lixeira/.test(path)) return `trash.${action}`;
  if (/^\/produto\/\d+\/excluir-tudo$/.test(path)) return 'products.delete';
  if (/^\/produto\/\d+\/fornecedor$/.test(path)) return 'products.edit';
  if (path === '/produto-aggregate' || path === '/totais' || path.startsWith('/relatorio/') || path.startsWith('/estoque/valor')) return 'reports.read';
  if (/^\/(produto|produtos)(?:\/|$)/.test(path)) return `products.${action}`;
  if (/^\/marca(?:\/|$)/.test(path)) return `brands.${action}`;
  if (/^\/familia(?:\/|$)/.test(path)) return `families.${action}`;
  if (/^\/fornecedor(?:\/|$)/.test(path)) return `suppliers.${action}`;
  if (/^\/alertas(?:\/|$)/.test(path)) return `alerts.${action}`;
  if (path.startsWith('/estoque')) return 'stock.read';
  if (path.startsWith('/api-docs')) return 'profiles.read';
  return null;
}
