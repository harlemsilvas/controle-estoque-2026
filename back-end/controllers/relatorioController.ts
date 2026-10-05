import sql from 'mssql';
import { Request, Response, NextFunction } from 'express';

export function movimentacoesCsv(items: any[]): string {
  const cell = (value: unknown) => {
    let text = value == null ? '' : value instanceof Date ? value.toISOString().replace('T', ' ').slice(0, 19) : String(value);
    if (typeof value === 'string' && /^[\s]*[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  return '\uFEFF' + [['Data', 'Produto', 'Tipo', 'Quantidade', 'Usuário'], ...items.map(m =>
    [m.DATA, m.PRODUTO, m.TIPO_LANCAMENTO, m.QUANTIDADE, m.USUARIO])]
    .map(row => row.map(cell).join(';')).join('\r\n');
}

export async function relatorioMovimentacoes(req: Request, res: Response, next: NextFunction) {
  try {
    const { dataInicio, dataFim, search = '', format } = req.query;
    const validDate = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
    if ((dataInicio && !validDate(dataInicio)) || (dataFim && !validDate(dataFim))
      || (dataInicio && dataFim && String(dataInicio) > String(dataFim)))
      return res.status(400).json({ error: 'Informe um período válido, com início anterior ou igual ao fim.' });
    const page = Number(req.query.page ?? 1), limit = Number(req.query.limit ?? 10);
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 500
      || !Number.isSafeInteger((page - 1) * limit) || typeof search !== 'string' || search.length > 120)
      return res.status(400).json({ error: 'Paginação ou busca inválida.' });
    const allowed: Record<string, string> = { 'DATA ASC': 'ep.DATA ASC', 'DATA DESC': 'ep.DATA DESC',
      'PRODUTO ASC': 'p.DESCRICAO ASC', 'PRODUTO DESC': 'p.DESCRICAO DESC' };
    const order = allowed[String(req.query.orderBy ?? 'DATA DESC').toUpperCase()] || allowed['DATA DESC'];
    let where = '1=1';
    if (dataInicio) where += ' AND ep.DATA >= @dataInicio';
    if (dataFim) where += ' AND ep.DATA < DATEADD(day, 1, @dataFim)';
    if (search.trim()) where += ' AND (p.DESCRICAO LIKE @search OR CAST(p.CODIGO AS varchar(30)) LIKE @search)';
    const request = () => {
      const q = new sql.Request();
      if (dataInicio) q.input('dataInicio', sql.Date, dataInicio);
      if (dataFim) q.input('dataFim', sql.Date, dataFim);
      if (search.trim()) q.input('search', sql.NVarChar, `%${search.trim()}%`);
      return q;
    };
    const count = await request().query(`SELECT COUNT(*) AS total FROM ESTOQUE_PRODUTO ep
      JOIN PRODUTO p ON ep.CODIGO_PRODUTO = p.CODIGO WHERE ${where}`);
    const totalItems = count.recordset[0].total;
    const csv = format === 'csv';
    if (csv && totalItems > 50000) return res.status(413).json({ error: 'O relatório excede 50.000 linhas. Reduza o período ou refine a busca para exportar.' });
    const q = request();
    if (!csv) q.input('limit', sql.Int, limit).input('offset', sql.Int, (page - 1) * limit);
    const result = await q.query(`SELECT ${csv ? 'TOP (50001)' : ''} ep.DATA, p.DESCRICAO AS PRODUTO, ep.TIPO_LANCAMENTO, ep.QUANTIDADE, ep.USUARIO
      FROM ESTOQUE_PRODUTO ep JOIN PRODUTO p ON ep.CODIGO_PRODUTO = p.CODIGO WHERE ${where}
      ORDER BY ${order}, ep.CODIGO_PRODUTO ASC ${csv ? '' : 'OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY'}`);
    if (csv) {
      if (result.recordset.length > 50000) return res.status(413).json({ error: 'O relatório excede 50.000 linhas. Refine os filtros.' });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="movimentacoes.csv"');
      return res.send(movimentacoesCsv(result.recordset));
    }
    res.json({ items: result.recordset, totalPages: Math.ceil(totalItems / limit), totalItems });
  } catch (err) { next(err); }
}
