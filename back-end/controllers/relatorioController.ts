import sql from 'mssql';
import { Request, Response, NextFunction } from 'express';

// Novo endpoint para relatório de movimentações de estoque
export async function relatorioMovimentacoes(req: Request, res: Response, next: NextFunction) {
  try {
    const { dataInicio, dataFim, limit = 10, orderBy = 'DATA DESC', page = 1 } = req.query;
    let where = '1=1';
    if (dataInicio) where += ` AND DATA >= @dataInicio`;
    if (dataFim) where += ` AND DATA <= @dataFim`;
    const order = ['DATA ASC', 'DATA DESC', 'PRODUTO ASC', 'PRODUTO DESC'].includes(
      (orderBy as string).toUpperCase()
    )
      ? (orderBy as string)
      : 'DATA DESC';
    const offset = (Number(page) - 1) * Number(limit);

    // Total de registros para paginação
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ESTOQUE_PRODUTO ep
      JOIN PRODUTO p ON ep.CODIGO_PRODUTO = p.CODIGO
      WHERE ${where}
    `;
    const countRequest = new sql.Request();
    if (dataInicio) countRequest.input('dataInicio', dataInicio);
    if (dataFim) countRequest.input('dataFim', dataFim);
    const countResult = await countRequest.query(countQuery);
    const totalItems = countResult.recordset[0].total;
    const totalPages = Math.ceil(totalItems / Number(limit));

    // Consulta paginada
    const query = `
      SELECT ep.DATA, p.DESCRICAO AS PRODUTO, ep.TIPO_LANCAMENTO, ep.QUANTIDADE, ep.USUARIO
      FROM ESTOQUE_PRODUTO ep
      JOIN PRODUTO p ON ep.CODIGO_PRODUTO = p.CODIGO
      WHERE ${where}
      ORDER BY ${order}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `;
    const request = new sql.Request();
    request.input('limit', Number(limit));
    request.input('offset', offset);
    if (dataInicio) request.input('dataInicio', dataInicio);
    if (dataFim) request.input('dataFim', dataFim);
    const result = await request.query(query);

    res.json({
      items: result.recordset,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
}
