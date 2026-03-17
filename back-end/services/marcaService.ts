import marcaModel from '../models/Marca';

const marcaService = {
  async listarTodos() {
    return await marcaModel.getAll();
  },

  /**
   * Lista marcas paginadas
   * @param {number} page
   * @param {number} limit
   */
  async listarPaginado(
    page = 1,
    limit = 10,
    search = '',
    orderBy = 'DESCRICAO',
    orderDir: 'asc' | 'desc' = 'asc'
  ) {
    return await marcaModel.getPaginated(page, limit, search, orderBy, orderDir);
  },
  async buscarPorCodigo(codigo: number) {
    const marca = await marcaModel.getById(codigo);
    if (!marca) throw new Error('Marca não encontrada');
    return marca;
  },
  async criar(data: any) {
    return await marcaModel.create(data);
  },
  async atualizar(codigo: number, data: any) {
    return await marcaModel.update(codigo, data);
  },
  /**
   * Remove uma marca. Se houver produtos vinculados, lança erro amigável.
   * Se for passado force=true, atualiza produtos para marca padrão (1) e remove a marca.
   */
  async remover(codigo: number, force = false) {
    return await marcaModel.remove(codigo, force);
  },
};

export default marcaService;
