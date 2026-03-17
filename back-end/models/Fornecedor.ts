import sql from 'mssql';
import { connectToDatabase } from './db';

export interface Fornecedor {
  CODIGO?: number;
  NOME: string;
  CNPJ: string;
  TELEFONE?: string;
  EMAIL?: string;
  ENDERECO?: string;
}

const fornecedorModel = {
  async getAllPaged({
    page = 1,
    limit = 20,
    search = '',
    orderBy = 'CODIGO',
    orderDir = 'asc',
  }: {
    page?: number;
    limit?: number;
    search?: string;
    orderBy?: string;
    orderDir?: 'asc' | 'desc';
  }): Promise<{ data: Fornecedor[]; total: number; totalPages: number }> {
    await connectToDatabase();
    const offset = (page - 1) * limit;
    let where = '';
    // (removido whereParams, não é necessário)
    if (search) {
      where = 'WHERE NOME LIKE @search';
      // Linha removida: whereParams não é mais usada
    }
    // Validação simples para evitar SQL injection
    const allowedOrder = ['CODIGO', 'NOME', 'CNPJ'];
    const order = allowedOrder.includes(orderBy.toUpperCase()) ? orderBy : 'CODIGO';
    const dir = orderDir && orderDir.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // Montar query de contagem
    let totalResult;
    if (where) {
      totalResult =
        await sql.query`SELECT COUNT(*) as total FROM FORNECEDOR WHERE NOME LIKE ${`%${search}%`}`;
    } else {
      totalResult = await sql.query`SELECT COUNT(*) as total FROM FORNECEDOR`;
    }
    const total = totalResult.recordset[0].total;
    const totalPages = Math.ceil(total / limit);

    // Montar query de dados
    let result;
    if (where) {
      const query = `SELECT * FROM FORNECEDOR WHERE NOME LIKE @search ORDER BY ${order} ${dir} OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
      result = await new sql.Request()
        .input('search', sql.VarChar, `%${search}%`)
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, limit)
        .query(query);
    } else {
      const query = `SELECT * FROM FORNECEDOR ORDER BY ${order} ${dir} OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
      result = await new sql.Request()
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, limit)
        .query(query);
    }
    return { data: result.recordset, total, totalPages };
  },
  async getById(codigo: number): Promise<Fornecedor | undefined> {
    await connectToDatabase();
    const result = await sql.query`SELECT * FROM FORNECEDOR WHERE CODIGO = ${codigo}`;
    return result.recordset[0];
  },
  async create(data: Fornecedor): Promise<Fornecedor> {
    const { NOME, CNPJ, TELEFONE, EMAIL, ENDERECO } = data;
    await connectToDatabase();
    const result = await sql.query`
      INSERT INTO FORNECEDOR (NOME, CNPJ, TELEFONE, EMAIL, ENDERECO)
      VALUES (${NOME}, ${CNPJ}, ${TELEFONE || null}, ${EMAIL || null}, ${ENDERECO || null});
      SELECT SCOPE_IDENTITY() AS CODIGO;
    `;
    return result.recordset[0];
  },
  async update(codigo: number, data: Fornecedor): Promise<Fornecedor | undefined> {
    const { NOME, CNPJ, TELEFONE, EMAIL, ENDERECO } = data;
    await connectToDatabase();
    await sql.query`
      UPDATE FORNECEDOR SET
        NOME = ${NOME},
        CNPJ = ${CNPJ},
        TELEFONE = ${TELEFONE || null},
        EMAIL = ${EMAIL || null},
        ENDERECO = ${ENDERECO || null}
      WHERE CODIGO = ${codigo}
    `;
    return this.getById(codigo);
  },
  /**
   * Remove um fornecedor. Se existirem produtos vinculados, lança erro.
   * Se for passado o parâmetro force=true, atualiza os produtos para fornecedor padrão (1) e remove o fornecedor.
   */
  async remove(codigo: number, force = false): Promise<{ codigo: number }> {
    await connectToDatabase();
    // Verifica se há produtos vinculados
    const result = await sql.query`SELECT * FROM PRODUTO WHERE COD_FORNECEDOR = ${codigo}`;
    const produtosVinculados = result.recordset;
    const total = produtosVinculados.length;
    if (total > 0 && !force) {
      interface FornecedorError extends Error {
        code?: string;
        vinculos?: unknown;
      }
      const error: FornecedorError = new Error(
        'Não é possível remover: existem produtos vinculados a este fornecedor.'
      );
      error.code = 'FK_PRODUTO_FORNECEDOR';
      error.vinculos = produtosVinculados;
      throw error;
    }
    if (total > 0 && force) {
      // Atualiza produtos para fornecedor padrão (1)
      await sql.query`UPDATE PRODUTO SET COD_FORNECEDOR = 1 WHERE COD_FORNECEDOR = ${codigo}`;
    }
    await sql.query`DELETE FROM FORNECEDOR WHERE CODIGO = ${codigo}`;
    return { codigo };
  },
};

export default fornecedorModel;
