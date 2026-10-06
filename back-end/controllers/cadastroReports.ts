import { Request, Response, NextFunction } from 'express';
import sql from 'mssql';
import { AuthRequest } from '../middleware/authMiddleware';
import { connectToDatabase } from '../models/db';
type Report = { permission: string; from: string; select: string; where: string; search: string; order: string; columns: { key: string; label: string; text?: boolean }[] };
const column = (key: string, label: string, text = false) => ({ key, label, text });
export const cadastroReports: Record<string, Report> = {
  produtos: { permission: 'products.read', from: 'PRODUTO p LEFT JOIN FORNECEDOR f ON f.CODIGO=p.COD_FORNECEDOR LEFT JOIN MARCA_PRODUTO m ON m.CODIGO=p.CODIGO_MARCA LEFT JOIN FAMILIA_PRODUTO h ON h.CODIGO=p.CODIGO_FAMILIA',
    select: 'p.CODIGO,p.DESCRICAO,p.CODIGO_INTERNO,p.CODIGO_BARRAS,p.COD_FORNECEDOR,f.NOME AS FORNECEDOR,p.CODIGO_MARCA,m.DESCRICAO AS MARCA,p.CODIGO_FAMILIA,h.DESCRICAO AS FAMILIA,p.VALOR_UNITARIO,p.ESTOQUE_MINIMO,p.ESTOQUE_ATUAL',
    where: '(p.DELETADO=0 OR p.DELETADO IS NULL)', search: "(CAST(p.CODIGO AS varchar(20)) LIKE @search ESCAPE '~' OR p.DESCRICAO LIKE @search ESCAPE '~' OR p.CODIGO_BARRAS LIKE @search ESCAPE '~' OR p.CODIGO_INTERNO LIKE @search ESCAPE '~')", order: 'p.CODIGO',
    columns: [column('CODIGO','Código'),column('DESCRICAO','Descrição'),column('CODIGO_INTERNO','Código interno',true),column('CODIGO_BARRAS','Código de barras',true),column('COD_FORNECEDOR','Código fornecedor'),column('FORNECEDOR','Fornecedor'),column('CODIGO_MARCA','Código marca'),column('MARCA','Marca'),column('CODIGO_FAMILIA','Código família'),column('FAMILIA','Família'),column('VALOR_UNITARIO','Valor unitário'),column('ESTOQUE_MINIMO','Estoque mínimo'),column('ESTOQUE_ATUAL','Estoque atual')] },
  fornecedores: { permission: 'suppliers.read', from: 'FORNECEDOR f', select: 'f.CODIGO,f.NOME,f.CNPJ,f.TELEFONE,f.EMAIL,f.ENDERECO', where: '1=1', search: "(CAST(f.CODIGO AS varchar(20)) LIKE @search ESCAPE '~' OR f.NOME LIKE @search ESCAPE '~' OR f.CNPJ LIKE @search ESCAPE '~')", order: 'f.CODIGO',
    columns: [column('CODIGO','Código'),column('NOME','Nome'),column('CNPJ','CNPJ',true),column('TELEFONE','Telefone',true),column('EMAIL','E-mail'),column('ENDERECO','Endereço')] },
  marcas: { permission: 'brands.read', from: 'MARCA_PRODUTO m', select: 'm.CODIGO,m.DESCRICAO', where: '1=1', search: "(CAST(m.CODIGO AS varchar(20)) LIKE @search ESCAPE '~' OR m.DESCRICAO LIKE @search ESCAPE '~')", order: 'm.CODIGO', columns: [column('CODIGO','Código'),column('DESCRICAO','Descrição')] },
  familias: { permission: 'families.read', from: 'FAMILIA_PRODUTO h', select: 'h.CODIGO,h.DESCRICAO', where: '1=1', search: "(CAST(h.CODIGO AS varchar(20)) LIKE @search ESCAPE '~' OR h.DESCRICAO LIKE @search ESCAPE '~')", order: 'h.CODIGO', columns: [column('CODIGO','Código'),column('DESCRICAO','Descrição')] }
};
export function cadastroCsv(report: Report, rows: any[]) {
  const cell = (value: unknown, text = false) => {
    let str = value == null ? '' : typeof value === 'number' ? String(value).replace('.', ',') : String(value);
    if (str && (text || (typeof value === 'string' && /^[\s]*[=+\-@]/.test(str)))) str = "'" + str;
    return '"' + str.replace(/"/g, '""') + '"';
  };
  return '\uFEFF' + [report.columns.map(c=>cell(c.label)).join(';'), ...rows.map(row=>report.columns.map(c=>cell(row[c.key], !!c.text)).join(';'))].join('\r\n');
}
export async function reportCadastros(req: Request, res: Response, next: NextFunction) {
  try {
    const resource = req.params.resource, report = cadastroReports[resource];
    if (!Object.prototype.hasOwnProperty.call(cadastroReports, resource)) return res.status(404).json({ error: 'Relatório inexistente.' });
    if (!(req as AuthRequest).user?.permissions.includes(report.permission)) return res.status(403).json({ error: 'Seu perfil não permite consultar este cadastro.' });
    const search = req.query.search ?? '', page = Number(req.query.page ?? 1), limit = Number(req.query.limit ?? 25), format = req.query.format;
    if (typeof search !== 'string' || search.length > 120 || !Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100
      || (!Number.isSafeInteger((page-1)*limit) || (page-1)*limit > 2147483647) || (format !== undefined && format !== 'csv')) return res.status(400).json({ error: 'Busca, formato ou paginação inválidos.' });
    const pool = await connectToDatabase(), request = pool.request();
    request.input('search', sql.NVarChar(250), '%' + search.trim().replace(/[~%_\[]/g, c=>'~'+c) + '%');
    let where = report.where + ' AND ' + report.search;
    for (const [key, field] of Object.entries({ fornecedor:'p.COD_FORNECEDOR', marca:'p.CODIGO_MARCA', familia:'p.CODIGO_FAMILIA' })) {
      const raw = req.query[key]; if (raw === undefined || raw === '') continue;
      const value = Number(raw); if (resource !== 'produtos' || typeof raw !== 'string' || !Number.isSafeInteger(value) || value < 1 || value > 2147483647)
        return res.status(400).json({ error: 'Filtro de cadastro inválido.' });
      request.input(key, sql.Int, value); where += ` AND ${field}=@${key}`;
    }
    if (format === 'csv') {
      const result = await request.query(`SELECT TOP (10001) ${report.select} FROM ${report.from} WHERE ${where} ORDER BY ${report.order}`);
      if (result.recordset.length > 10000) return res.status(413).json({ error: 'Exportação limitada a 10.000 registros. Refine os filtros.' });
      res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition',`attachment; filename="cadastro-${resource}.csv"`);
      return res.send(cadastroCsv(report, result.recordset));
    }
    request.input('offset', sql.Int, (page-1)*limit).input('limit', sql.Int, limit);
    const result = await request.query(`SELECT COUNT(*) AS total FROM ${report.from} WHERE ${where}; SELECT ${report.select} FROM ${report.from} WHERE ${where} ORDER BY ${report.order} OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`);
    const sets = result.recordsets as sql.IRecordSet<any>[];
    res.json({ data: sets[1], total: sets[0][0].total, page, limit, columns: report.columns });
  } catch(error) { next(error); }
}
