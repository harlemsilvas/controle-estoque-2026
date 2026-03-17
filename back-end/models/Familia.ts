import sql from 'mssql';
import { connectToDatabase } from './db';

export interface Familia {
  CODIGO?: number;
  DESCRICAO: string;
}

const familiaModel = {
  async getAll(): Promise<Familia[]> {
    await connectToDatabase();
    const result = await sql.query`SELECT * FROM FAMILIA_PRODUTO`;
    return result.recordset;
  },

  /**
   * Retorna famílias paginadas
   * @param {number} page Página atual (1-based)
   * @param {number} limit Quantidade por página
   * @returns {Promise<{ data: Familia[], total: number, totalPages: number }>}
   */
  async getPaginated(
    page = 1,
    limit = 20,
    search = '',
    orderBy = 'DESCRICAO',
    orderDir: 'asc' | 'desc' = 'asc'
  ): Promise<{ data: Familia[]; total: number; totalPages: number }> {
    await connectToDatabase();
    const offset = (page - 1) * limit;
    let where = '';
    const params: {
      name: string;
      type: typeof sql.VarChar | typeof sql.Int;
      value: string | number;
    }[] = [];
    if (search) {
      where = 'WHERE DESCRICAO LIKE @search';
      params.push({ name: 'search', type: sql.VarChar, value: `%${search}%` });
    }
    const order = ['CODIGO', 'DESCRICAO'].includes(orderBy) ? orderBy : 'DESCRICAO';
    const dir = orderDir === 'desc' ? 'DESC' : 'ASC';
    const query = `SELECT * FROM FAMILIA_PRODUTO ${where} ORDER BY ${order} ${dir} OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    const countQuery = `SELECT COUNT(*) as total FROM FAMILIA_PRODUTO ${where}`;
    const request = new sql.Request();
    params.forEach((p) => request.input(p.name, p.type, p.value));
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);
    const dataResult = await request.query(query);
    const countRequest = new sql.Request();
    params.forEach((p) => countRequest.input(p.name, p.type, p.value));
    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0].total;
    const totalPages = Math.ceil(total / limit);
    return {
      data: dataResult.recordset,
      total,
      totalPages,
    };
  },

  async getById(codigo: number): Promise<Familia | undefined> {
    await connectToDatabase();
    const result = await sql.query`SELECT * FROM FAMILIA_PRODUTO WHERE CODIGO = ${codigo}`;
    return result.recordset[0];
  },
  async create(data: Familia): Promise<Familia> {
    await connectToDatabase();
    const { DESCRICAO } = data;
    const result = await sql.query`
      INSERT INTO FAMILIA_PRODUTO (DESCRICAO)
      VALUES (${DESCRICAO});
      SELECT SCOPE_IDENTITY() AS CODIGO;
    `;
    return result.recordset[0];
  },
  async update(codigo: number, data: Familia): Promise<Familia | undefined> {
    await connectToDatabase();
    const { DESCRICAO } = data;
    await sql.query`UPDATE FAMILIA_PRODUTO SET DESCRICAO = ${DESCRICAO} WHERE CODIGO = ${codigo}`;
    return this.getById(codigo);
  },
  /**
   * Remove uma família. Se existirem produtos vinculados, lança erro.
   * Se for passado o parâmetro force=true, atualiza os produtos para família padrão (1) e remove a família.
   */
  async remove(codigo: number, force = false): Promise<{ codigo: number }> {
    await connectToDatabase();
    // Busca produtos vinculados
    const result = await sql.query`SELECT * FROM PRODUTO WHERE CODIGO_FAMILIA = ${codigo}`;
    const produtosVinculados = result.recordset;
    const total = produtosVinculados.length;
    if (total > 0 && !force) {
      interface FamiliaError extends Error {
        code?: string;
        vinculos?: unknown;
      }
      const error: FamiliaError = new Error(
        'Não é possível remover: existem produtos vinculados a esta família.'
      );
      error.code = 'FK_PRODUTO_FAMILIA';
      error.vinculos = produtosVinculados;
      throw error;
    }
    if (total > 0 && force) {
      // Atualiza produtos para família padrão (1)
      await sql.query`UPDATE PRODUTO SET CODIGO_FAMILIA = 1 WHERE CODIGO_FAMILIA = ${codigo}`;
    }
    await sql.query`DELETE FROM FAMILIA_PRODUTO WHERE CODIGO = ${codigo}`;
    return { codigo };
  },
};

export default familiaModel;
