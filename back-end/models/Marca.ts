import sql from 'mssql';
import { connectToDatabase } from './db';

export interface Marca {
  CODIGO?: number;
  DESCRICAO: string;
}

const marcaModel = {
  async getAll(): Promise<Marca[]> {
    await connectToDatabase();
    const result = await sql.query`SELECT * FROM MARCA_PRODUTO`;
    return result.recordset;
  },

  /**
   * Retorna marcas paginadas
   * @param {number} page Página atual (1-based)
   * @param {number} limit Quantidade por página
   * @returns {Promise<{ data: Marca[], total: number, totalPages: number }>}
   */
  async getPaginated(
    page = 1,
    limit = 10,
    search = '',
    orderBy = 'DESCRICAO',
    orderDir: 'asc' | 'desc' = 'asc'
  ): Promise<{ data: Marca[]; total: number; totalPages: number }> {
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
    const query = `SELECT * FROM MARCA_PRODUTO ${where} ORDER BY ${order} ${dir} OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    const countQuery = `SELECT COUNT(*) as total FROM MARCA_PRODUTO ${where}`;
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
  async getById(codigo: number): Promise<Marca | undefined> {
    await connectToDatabase();
    const result = await sql.query`SELECT * FROM MARCA_PRODUTO WHERE CODIGO = ${codigo}`;
    return result.recordset[0];
  },
  async create(data: Marca): Promise<Marca> {
    await connectToDatabase();
    const { DESCRICAO } = data;
    const result = await sql.query`
      INSERT INTO MARCA_PRODUTO (DESCRICAO)
      VALUES (${DESCRICAO});
      SELECT SCOPE_IDENTITY() AS CODIGO;
    `;
    return result.recordset[0];
  },
  async update(codigo: number, data: Marca): Promise<Marca | undefined> {
    await connectToDatabase();
    const { DESCRICAO } = data;
    await sql.query`UPDATE MARCA_PRODUTO SET DESCRICAO = ${DESCRICAO} WHERE CODIGO = ${codigo}`;
    return this.getById(codigo);
  },
  /**
   * Remove uma marca. Se existirem produtos vinculados, lança erro.
   * Se for passado o parâmetro force=true, atualiza os produtos para marca padrão (1) e remove a marca.
   */
  async remove(codigo: number, force = false): Promise<{ codigo: number }> {
    await connectToDatabase();
    // Verifica se há produtos vinculados
    const result =
      await sql.query`SELECT COUNT(*) as total FROM PRODUTO WHERE CODIGO_MARCA = ${codigo}`;
    const total = result.recordset[0]?.total || 0;
    if (total > 0 && !force) {
      const error: any = new Error(
        'Não é possível remover: existem produtos vinculados a esta marca.'
      );
      error.code = 'FK_PRODUTO_MARCA';
      throw error;
    }
    if (total > 0 && force) {
      // Atualiza produtos para marca padrão (1)
      await sql.query`UPDATE PRODUTO SET CODIGO_MARCA = 1 WHERE CODIGO_MARCA = ${codigo}`;
    }
    await sql.query`DELETE FROM MARCA_PRODUTO WHERE CODIGO = ${codigo}`;
    return { codigo };
  },
};

export default marcaModel;
