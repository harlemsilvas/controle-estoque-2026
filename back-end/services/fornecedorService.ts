import fornecedorModel from '../models/Fornecedor';

const fornecedorService = {
  async listarTodos({
    page = 1,
    limit = 20,
    search = '',
    orderBy = 'NOME',
    orderDir = 'asc',
  }: {
    page?: number;
    limit?: number;
    search?: string;
    orderBy?: string;
    orderDir?: 'asc' | 'desc';
  } = {}) {
    return await fornecedorModel.getAllPaged({ page, limit, search, orderBy, orderDir });
  },
  async buscarPorCodigo(codigo: number) {
    const fornecedor = await fornecedorModel.getById(codigo);
    if (!fornecedor) throw new Error('Fornecedor não encontrado');
    return fornecedor;
  },
  async criar(data: any) {
    return await fornecedorModel.create(data);
  },
  async atualizar(codigo: number, data: any) {
    return await fornecedorModel.update(codigo, data);
  },
  /**
   * Remove um fornecedor. Se houver produtos vinculados, lança erro amigável.
   * Se for passado force=true, atualiza produtos para fornecedor padrão (1) e remove o fornecedor.
   */
  async remover(codigo: number, force = false) {
    return await fornecedorModel.remove(codigo, force);
  },
};

export default fornecedorService;
