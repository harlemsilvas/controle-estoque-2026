import sql from 'mssql';

const produtoVinculoService = {
  async listarVinculosProduto(codigoProduto: number) {
    // Busca todos os registros vinculados ao produto em tabelas conhecidas
    // Exemplo: ESTOQUE_PRODUTO
    const result = await sql.query`
      SELECT * FROM ESTOQUE_PRODUTO WHERE CODIGO_PRODUTO = ${codigoProduto}
    `;
    return result.recordset;
  },

  async excluirVinculosProduto(codigoProduto: number) {
    // Exclui todos os registros vinculados ao produto em tabelas conhecidas
    await sql.query`DELETE FROM ESTOQUE_PRODUTO WHERE CODIGO_PRODUTO = ${codigoProduto}`;
  },
};

export default produtoVinculoService;
