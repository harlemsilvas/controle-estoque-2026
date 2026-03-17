import sql from 'mssql';
import produtoModel from '../models/Produto';

const produtoService = {
  async getProdutoPorBarcode(barcode: string) {
    const result = await sql.query`
      SELECT * FROM PRODUTO WHERE CODIGO_BARRAS = ${barcode}`;
    return result.recordset[0];
  },
  async listarTodos({
    offset = 0,
    limit = 2000,
    fornecedor,
    marca,
    familia,
    search,
    orderBy = 'CODIGO',
    orderDir = 'ASC',
  }: {
    offset?: number;
    limit?: number;
    fornecedor?: string;
    marca?: string;
    familia?: string;
    search?: string;
    orderBy?: string;
    orderDir?: string;
  } = {}) {
    // Filtro dinâmico por fornecedor, marca, família e busca
    let where = '(DELETADO = 0 OR DELETADO IS NULL)';
    if (fornecedor) {
      where += ' AND COD_FORNECEDOR = @fornecedor';
    }
    if (marca) {
      where += ' AND CODIGO_MARCA = @marca';
    }
    if (familia) {
      where += ' AND CODIGO_FAMILIA = @familia';
    }
    if (search) {
      where +=
        ' AND (CAST(CODIGO AS VARCHAR) LIKE @search OR DESCRICAO LIKE @search OR CODIGO_BARRAS LIKE @search)';
    }
    // LOG de debug
    console.log('[listarTodos] Parâmetros:', {
      offset,
      limit,
      fornecedor,
      marca,
      familia,
      search,
      orderBy,

      orderDir,
    });
    // console.log('[listarTodos] Valor de familia:', familia);
    // Sanitização de campos de ordenação
    const allowedOrderBy = ['CODIGO', 'DESCRICAO'];
    const allowedOrderDir = ['ASC', 'DESC'];
    const orderField = allowedOrderBy.includes(orderBy.toUpperCase())
      ? orderBy.toUpperCase()
      : 'CODIGO';
    const orderDirection = allowedOrderDir.includes(orderDir.toUpperCase())
      ? orderDir.toUpperCase()
      : 'ASC';
    // Consulta paginada
    const query = `SELECT * FROM PRODUTO WHERE ${where} ORDER BY ${orderField} ${orderDirection} OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    const totalQuery = `SELECT COUNT(*) as total FROM PRODUTO WHERE ${where}`;
    // console.log('[listarTodos] Query:', query);
    const request = new sql.Request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit);
    if (fornecedor) request.input('fornecedor', sql.VarChar, fornecedor);
    // console.log('🚀 ~ listarTodos ~ marca:', marca);
    if (marca) request.input('marca', sql.VarChar, marca);
    // console.log('🚀 ~ listarTodos ~ familia:', familia);
    if (familia) request.input('familia', sql.VarChar, familia);
    if (search) request.input('search', sql.VarChar, `%${search}%`);
    const produtosResult = await request.query(query);
    const totalRequest = new sql.Request();
    if (fornecedor) totalRequest.input('fornecedor', sql.VarChar, fornecedor);
    if (marca) totalRequest.input('marca', sql.VarChar, marca);
    if (familia) totalRequest.input('familia', sql.VarChar, familia);
    if (search) totalRequest.input('search', sql.VarChar, `%${search}%`);
    const totalResult = await totalRequest.query(totalQuery);
    const total = totalResult.recordset[0]?.total || 0;
    console.log('[listarTodos] Total:', total);
    return {
      produtos: produtosResult.recordset,
      total,
    };
  },
  async aggregate() {
    // Por Família
    const byFamily = await sql.query`
      SELECT
        fp.DESCRICAO AS FAMILIA,
        COUNT(*) AS total,
        SUM(p.VALOR_UNITARIO*p.ESTOQUE_ATUAL) AS ValorTotalEstoque
      FROM
        PRODUTO p
      JOIN
        FAMILIA_PRODUTO fp ON p.CODIGO_FAMILIA = fp.CODIGO
      GROUP BY fp.DESCRICAO
    `;

    // Por Marca
    const byMarca = await sql.query`
      SELECT
        mp.DESCRICAO AS MARCA,
        COUNT(*) AS total,
        SUM(p.VALOR_UNITARIO*p.ESTOQUE_ATUAL) AS ValorTotalEstoque
      FROM
        PRODUTO p
      JOIN
        MARCA_PRODUTO mp ON p.CODIGO_MARCA = mp.CODIGO
      GROUP BY mp.DESCRICAO
    `;

    // Por Fornecedor
    const byFornecedor = await sql.query`
      SELECT 
        m.NOME AS FORNECEDOR,
        SUM(p.ESTOQUE_ATUAL) AS total,
        SUM(p.VALOR_UNITARIO*p.ESTOQUE_ATUAL) AS ValorTotalEstoque
      FROM PRODUTO p
      JOIN FORNECEDOR m ON p.COD_FORNECEDOR = m.CODIGO      
      GROUP BY m.NOME
    `;

    return {
      byFamily: byFamily.recordset,
      byMarca: byMarca.recordset,
      byFornecedor: byFornecedor.recordset,
    };
  },
  async getEstoque() {
    const result = await sql.query`
      SELECT
        CODIGO,
        DESCRICAO,
        ESTOQUE_ATUAL,
        ESTOQUE_MINIMO
      FROM PRODUTO
    `;
    return result.recordset;
  },
  async buscarPorCodigo(codigo: number) {
    const produto = await produtoModel.getById(codigo);
    if (!produto) throw new Error('Produto não encontrado');
    return produto;
  },
  async criar(produtoData: any) {
    // Adicione validações ou regras de negócio aqui
    return await produtoModel.create(produtoData);
  },
  async atualizar(codigo: number, produtoData: any) {
    // Validação ou lógica extra pode ser adicionada aqui
    return await produtoModel.update(codigo, produtoData);
  },
  async remover(codigo: number) {
    // Ao invés de remover fisicamente, marca como deletado
    await sql.query`UPDATE PRODUTO SET DELETADO = 1 WHERE CODIGO = ${codigo}`;
    return { codigo };
  },

  // Lixeira: lista produtos deletados
  async listarLixeira() {
    const result = await sql.query`SELECT * FROM PRODUTO WHERE DELETADO = 1`;
    return result.recordset;
  },

  // Lixeira: conta produtos deletados
  async contarLixeira() {
    const result = await sql.query`SELECT COUNT(*) AS count FROM PRODUTO WHERE DELETADO = 1`;
    return result.recordset[0]?.count || 0;
  },

  // Lixeira: restaurar produto
  async restaurarProduto(codigo: number) {
    await sql.query`UPDATE PRODUTO SET DELETADO = 0 WHERE CODIGO = ${codigo}`;
    return { codigo };
  },

  // Lixeira: excluir permanentemente
  async excluirPermanentemente(codigo: number) {
    await sql.query`DELETE FROM PRODUTO WHERE CODIGO = ${codigo}`;
    return { codigo };
  },

  // Busca produtos por termo (código ou descrição)
  async buscarProdutos(termo: string) {
    const likeTerm = `%${termo}%`;
    const result = await sql.query`
      SELECT * FROM PRODUTO
      WHERE (CAST(CODIGO AS VARCHAR) LIKE ${likeTerm} OR DESCRICAO LIKE ${likeTerm})
        AND (DELETADO = 0 OR DELETADO IS NULL)
    `;
    return result.recordset;
  },
};

export default produtoService;
