import sql from 'mssql';

const alertaService = {
  async getAlertasAtivos() {
    const result = await sql.query(
      `SELECT a.*, p.DESCRICAO as PRODUTO_DESCRICAO, p.ESTOQUE_ATUAL, p.ESTOQUE_MINIMO FROM ALERTAS_ESTOQUE a INNER JOIN PRODUTO p ON a.CODIGO_PRODUTO = p.CODIGO WHERE a.STATUS = 'ativo'`
    );
    return result.recordset;
  },

  async getHistorico() {
    const result = await sql.query(
      `SELECT a.*, p.DESCRICAO as PRODUTO_DESCRICAO, p.ESTOQUE_ATUAL, p.ESTOQUE_MINIMO FROM ALERTAS_ESTOQUE a INNER JOIN PRODUTO p ON a.CODIGO_PRODUTO = p.CODIGO ORDER BY a.DATA_CRIACAO DESC`
    );
    return result.recordset;
  },

  async resolverAlerta(id: number, usuario: string) {
    const result = await sql.query`
      UPDATE ALERTAS_ESTOQUE 
      SET 
        STATUS = 'resolvido',
        DATA_RESOLUCAO = GETDATE(),
        USUARIO_NOTIFICADO = ${usuario}
      WHERE ID = ${id}
    `;
    return result.rowsAffected[0] > 0;
  },
};

export default alertaService;
