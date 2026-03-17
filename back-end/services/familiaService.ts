import familiaModel from '../models/Familia';

const familiaService = {
  async listarTodos() {
    return await familiaModel.getAll();
  },

  /**
   * Lista famílias paginadas
   * @param {number} page
   * @param {number} limit
   */
  async listarPaginado(
    page = 1,
    limit = 20,
    search = '',
    orderBy = 'DESCRICAO',
    orderDir: 'asc' | 'desc' = 'asc'
  ) {
    return await familiaModel.getPaginated(page, limit, search, orderBy, orderDir);
  },
  async buscarPorCodigo(codigo: number) {
    const familia = await familiaModel.getById(codigo);
    if (!familia) throw new Error('Família não encontrada');
    return familia;
  },
  async criar(data: any) {
    return await familiaModel.create(data);
  },
  async atualizar(codigo: number, data: any) {
    return await familiaModel.update(codigo, data);
  },
  /**
   * Remove uma família. Se houver produtos vinculados, lança erro amigável.
   * Se for passado force=true, atualiza produtos para família padrão (1) e remove a família.
   */
  async remover(codigo: number, force = false) {
    return await familiaModel.remove(codigo, force);
  },
};

export default familiaService;
