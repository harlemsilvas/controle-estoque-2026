import sql from 'mssql';

const notFoundError = (message: string) => {
  const error = new Error(message) as Error & { status?: number };
  error.status = 404;
  return error;
};

const estoqueService = {
  async getHistoricoPorBarcode(barcode: string) {
    // Buscar o código do produto pelo código de barras
    const produto = await sql.query`
      SELECT CODIGO FROM PRODUTO WHERE CODIGO_BARRAS = ${barcode}
    `;
    if (produto.recordset.length === 0) return [];
    const codigoProduto = produto.recordset[0].CODIGO;
    // Buscar até 20 movimentações pelo código do produto
    const result = await sql.query`
      SELECT TOP 20 * FROM ESTOQUE_PRODUTO WHERE CODIGO_PRODUTO = ${codigoProduto} ORDER BY DATA DESC
    `;
    return result.recordset;
  },

  // Retorna os 15 produtos com mais e menos estoque
  async getEstoqueResumo() {
    // Produtos com mais estoque
    const maisEstoque = await sql.query`
      SELECT TOP 15 CODIGO, DESCRICAO, ESTOQUE_ATUAL
      FROM PRODUTO
      WHERE (DELETADO = 0 OR DELETADO IS NULL)
      ORDER BY ESTOQUE_ATUAL DESC
    `;
    // Produtos com menos estoque (excluindo zerados e negativos)
    const menosEstoque = await sql.query`
      SELECT TOP 15 CODIGO, DESCRICAO, ESTOQUE_ATUAL
      FROM PRODUTO
      WHERE (DELETADO = 0 OR DELETADO IS NULL)
      ORDER BY ESTOQUE_ATUAL ASC
    `;
    return {
      maisEstoque: maisEstoque.recordset,
      menosEstoque: menosEstoque.recordset,
    };
  },

  // Modelo 1: Movimentação por código do produto
  async registrarMovimentacaoPorCodigo({
    codigoProduto,
    tipo,
    quantidade,
    usuario,
  }: {
    codigoProduto: number;
    tipo: string;
    quantidade: number;
    usuario: string;
  }) {
    const transaction = new sql.Transaction();
    try {
      await transaction.begin();
      // Buscar estoque atual
      const produto = await transaction.request().query`
        SELECT ESTOQUE_ATUAL FROM PRODUTO WHERE CODIGO = ${codigoProduto}
      `;
      if (produto.recordset.length === 0) {
        throw notFoundError('Produto não encontrado');
      }
      const estoqueAtual = produto.recordset[0].ESTOQUE_ATUAL;
      let novoEstoque = estoqueAtual;
      // Calcular novo estoque
      switch (tipo) {
        case 'E':
          novoEstoque += quantidade;
          break;
        case 'S':
          novoEstoque -= quantidade;
          break;
        case 'I':
          novoEstoque = quantidade;
          break;
        default:
          throw new Error('Tipo de movimentação inválido');
      }
      // Atualizar estoque
      await transaction.request().query`
        UPDATE PRODUTO SET ESTOQUE_ATUAL = ${novoEstoque} WHERE CODIGO = ${codigoProduto}
      `;
      // Registrar histórico
      await transaction.request().query`
        INSERT INTO ESTOQUE_PRODUTO (CODIGO_PRODUTO, TIPO_LANCAMENTO, QUANTIDADE, DATA, USUARIO)
        VALUES (${codigoProduto}, ${tipo}, ${quantidade}, GETDATE(), ${usuario})
      `;
      await transaction.commit();
      return { success: true, estoqueAnterior: estoqueAtual, novoEstoque };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  // Valor total geral do estoque
  async getValorTotalEstoque() {
    const result = await sql.query`
      SELECT SUM(ESTOQUE_ATUAL * VALOR_UNITARIO) AS valor_total FROM PRODUTO WHERE (DELETADO = 0 OR DELETADO IS NULL)`;
    return result.recordset[0]?.valor_total || 0;
  },

  // Valor total por família
  async getValorTotalPorFamilia() {
    const result = await sql.query`
      SELECT f.DESCRICAO AS familia, SUM(p.ESTOQUE_ATUAL * p.VALOR_UNITARIO) AS valor_total
      FROM PRODUTO p
      JOIN FAMILIA_PRODUTO f ON p.CODIGO_FAMILIA = f.CODIGO
      WHERE (p.DELETADO = 0 OR p.DELETADO IS NULL)
      GROUP BY f.DESCRICAO`;
    return result.recordset;
  },

  // Valor total por marca
  async getValorTotalPorMarca() {
    const result = await sql.query`
      SELECT m.DESCRICAO AS marca, SUM(p.ESTOQUE_ATUAL * p.VALOR_UNITARIO) AS valor_total
      FROM PRODUTO p
      JOIN MARCA_PRODUTO m ON p.CODIGO_MARCA = m.CODIGO
      WHERE (p.DELETADO = 0 OR p.DELETADO IS NULL)
      GROUP BY m.DESCRICAO`;
    return result.recordset;
  },

  // Valor total por fornecedor
  async getValorTotalPorFornecedor() {
    const result = await sql.query`
      SELECT f.NOME AS fornecedor, SUM(p.ESTOQUE_ATUAL * p.VALOR_UNITARIO) AS valor_total
      FROM PRODUTO p
      JOIN FORNECEDOR f ON p.COD_FORNECEDOR = f.CODIGO
      WHERE (p.DELETADO = 0 OR p.DELETADO IS NULL)
      GROUP BY f.NOME`;
    return result.recordset;
  },

  // Modelo 2: Movimentação por código de barras
  async registrarMovimentacaoPorBarcode({
    codigo_barras,
    tipo,
    quantidade,
    usuario,
  }: {
    codigo_barras: string;
    tipo: string;
    quantidade: number;
    usuario: string;
  }) {
    const transaction = new sql.Transaction();
    try {
      await transaction.begin();
      // Buscar código do produto
      const produto = await transaction.request().query`
        SELECT CODIGO, ESTOQUE_ATUAL FROM PRODUTO WHERE CODIGO_BARRAS = ${codigo_barras}
      `;
      if (produto.recordset.length === 0) {
        throw notFoundError('Produto não encontrado');
      }
      const codigoProduto = produto.recordset[0].CODIGO;
      const estoqueAtual = produto.recordset[0].ESTOQUE_ATUAL;
      let novoEstoque = estoqueAtual;
      if (tipo === 'E') novoEstoque += quantidade;
      if (tipo === 'S') novoEstoque -= quantidade;
      if (tipo === 'I') novoEstoque = quantidade;
      // Atualizar estoque
      await transaction.request().query`
        UPDATE PRODUTO SET ESTOQUE_ATUAL = ${novoEstoque} WHERE CODIGO = ${codigoProduto}
      `;
      // Registrar histórico
      await transaction.request().query`
        INSERT INTO ESTOQUE_PRODUTO (CODIGO_PRODUTO, TIPO_LANCAMENTO, QUANTIDADE, DATA, USUARIO)
        VALUES (${codigoProduto}, ${tipo}, ${quantidade}, GETDATE(), ${usuario})
      `;
      await transaction.commit();
      return { success: true, novoEstoque };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  // Retorna os 15 produtos com mais e menos estoque
};

export default estoqueService;
