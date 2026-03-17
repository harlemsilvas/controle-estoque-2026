import sql from 'mssql';
import { connectToDatabase } from './db';

export interface Produto {
  CODIGO?: number;
  DESCRICAO: string;
  CODIGO_INTERNO?: string;
  CODIGO_BARRAS?: string;
  ESTOQUE_MINIMO?: number;
  ESTOQUE_ATUAL?: number;
  CODIGO_MARCA?: number;
  CODIGO_FAMILIA?: number;
  VALOR_UNITARIO?: number;
  COD_FORNECEDOR?: number;
}

const produtoModel = {
  async getAll(): Promise<Produto[]> {
    await connectToDatabase();
    const result = await sql.query`SELECT * FROM PRODUTO`;
    return result.recordset;
  },
  async getById(codigo: number): Promise<Produto | undefined> {
    await connectToDatabase();
    const result = await sql.query`SELECT * FROM PRODUTO WHERE CODIGO = ${codigo}`;
    return result.recordset[0];
  },
  async create(produto: Produto): Promise<Produto> {
    await connectToDatabase();
    const {
      DESCRICAO,
      CODIGO_INTERNO,
      CODIGO_BARRAS,
      ESTOQUE_MINIMO,
      ESTOQUE_ATUAL,
      CODIGO_MARCA,
      CODIGO_FAMILIA,
      VALOR_UNITARIO,
      COD_FORNECEDOR,
    } = produto;
    const result = await sql.query`
      INSERT INTO PRODUTO (
        DESCRICAO, CODIGO_INTERNO, CODIGO_BARRAS, ESTOQUE_MINIMO, ESTOQUE_ATUAL,
        CODIGO_MARCA, CODIGO_FAMILIA, VALOR_UNITARIO, COD_FORNECEDOR
      ) VALUES (
        ${DESCRICAO}, ${CODIGO_INTERNO}, ${CODIGO_BARRAS}, ${ESTOQUE_MINIMO}, ${ESTOQUE_ATUAL},
        ${CODIGO_MARCA}, ${CODIGO_FAMILIA}, ${VALOR_UNITARIO}, ${COD_FORNECEDOR}
      );
      SELECT * FROM PRODUTO WHERE CODIGO = SCOPE_IDENTITY();
    `;
    return result.recordset[0];
  },
  async update(codigo: number, produto: Produto): Promise<Produto | undefined> {
    await connectToDatabase();
    const {
      DESCRICAO,
      CODIGO_INTERNO,
      CODIGO_BARRAS,
      ESTOQUE_MINIMO,
      ESTOQUE_ATUAL,
      CODIGO_MARCA,
      CODIGO_FAMILIA,
      VALOR_UNITARIO,
      COD_FORNECEDOR,
    } = produto;
    await sql.query`
      UPDATE PRODUTO SET
        DESCRICAO = ${DESCRICAO},
        CODIGO_INTERNO = ${CODIGO_INTERNO},
        CODIGO_BARRAS = ${CODIGO_BARRAS},
        ESTOQUE_MINIMO = ${ESTOQUE_MINIMO},
        ESTOQUE_ATUAL = ${ESTOQUE_ATUAL},
        CODIGO_MARCA = ${CODIGO_MARCA},
        CODIGO_FAMILIA = ${CODIGO_FAMILIA},
        VALOR_UNITARIO = ${VALOR_UNITARIO},
        COD_FORNECEDOR = ${COD_FORNECEDOR}
      WHERE CODIGO = ${codigo}
    `;
    return this.getById(codigo);
  },
  async remove(codigo: number): Promise<{ codigo: number }> {
    await connectToDatabase();
    await sql.query`DELETE FROM PRODUTO WHERE CODIGO = ${codigo}`;
    return { codigo };
  },
};

export default produtoModel;
