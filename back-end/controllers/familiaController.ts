import familiaService from '../services/familiaService';
import { Request, Response, NextFunction } from 'express';

const familiaController = {
  /**
   * @swagger
   * /familia/paginado:
   *   get:
   *     summary: Lista famílias com paginação, busca e ordenação
   *     tags: [Familia]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *         required: false
   *         description: Página
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *         required: false
   *         description: Limite por página
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         required: false
   *         description: Busca por descrição
   *       - in: query
   *         name: orderBy
   *         schema:
   *           type: string
   *         required: false
   *         description: Campo para ordenar (CODIGO ou DESCRICAO)
   *       - in: query
   *         name: orderDir
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *         required: false
   *         description: Direção da ordenação
   *     responses:
   *       200:
   *         description: Lista paginada de famílias
   */
  listarPaginado: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = (req.query.search as string) || '';
      const orderBy = (req.query.orderBy as string) || 'DESCRICAO';
      const orderDir = (req.query.orderDir as string) === 'desc' ? 'desc' : 'asc';
      const { data, total, totalPages } = await familiaService.listarPaginado(
        page,
        limit,
        search,
        orderBy,
        orderDir
      );
      res.json({ data, total, totalPages });
    } catch (err) {
      next(err);
    }
  },
  /**
   * @swagger
   * /familia:
   *   get:
   *     summary: Lista todas as famílias
   *     tags: [Familia]
   *     responses:
   *       200:
   *         description: Lista de famílias
   */
  listarTodos: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const familias = await familiaService.listarTodos();
      res.json(familias);
    } catch (err) {
      next(err);
    }
  },
  /**
   * @swagger
   * /familia/{codigo}:
   *   get:
   *     summary: Busca uma família pelo código
   *     tags: [Familia]
   *     parameters:
   *       - in: path
   *         name: codigo
   *         schema:
   *           type: integer
   *         required: true
   *         description: Código da família
   *     responses:
   *       200:
   *         description: Família encontrada
   *       404:
   *         description: Família não encontrada
   */
  buscarPorCodigo: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const codigo = parseInt(req.params.codigo, 10);
      const familia = await familiaService.buscarPorCodigo(codigo);
      res.json(familia);
    } catch (err) {
      next(err);
    }
  },
  /**
   * @swagger
   * /familia:
   *   post:
   *     summary: Cria uma nova família
   *     tags: [Familia]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       201:
   *         description: Família criada
   *       400:
   *         description: Erro de validação
   */
  criar: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const novaFamilia = await familiaService.criar(req.body);
      res.status(201).json(novaFamilia);
    } catch (err) {
      next(err);
    }
  },
  /**
   * @swagger
   * /familia/{codigo}:
   *   put:
   *     summary: Atualiza uma família existente
   *     tags: [Familia]
   *     parameters:
   *       - in: path
   *         name: codigo
   *         schema:
   *           type: integer
   *         required: true
   *         description: Código da família
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Família atualizada
   *       400:
   *         description: Erro de validação
   */
  atualizar: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const codigo = parseInt(req.params.codigo, 10);
      const familiaAtualizada = await familiaService.atualizar(codigo, req.body);
      res.json(familiaAtualizada);
    } catch (err) {
      next(err);
    }
  },
  /**
   * @swagger
   * /familia/{codigo}:
   *   delete:
   *     summary: Remove uma família
   *     tags: [Familia]
   *     parameters:
   *       - in: path
   *         name: codigo
   *         schema:
   *           type: integer
   *         required: true
   *         description: Código da família
   *     responses:
   *       204:
   *         description: Família removida
   *       400:
   *         description: Erro ao remover
   */
  remover: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const codigo = parseInt(req.params.codigo, 10);
      // Se vier ?force=true na query, faz remoção forçada
      const force = req.query.force === 'true';
      await familiaService.remover(codigo, force);
      res.status(204).send();
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code?: unknown }).code === 'FK_PRODUTO_FAMILIA'
      ) {
        const e = err as { message?: string; code?: string; vinculos?: unknown[] };
        return res.status(409).json({
          message:
            e.message ||
            'Não é possível remover: existem produtos vinculados a esta família. Para forçar a remoção, utilize a opção de exclusão forçada.',
          code: e.code,
          vinculos: e.vinculos || [],
        });
      }
      next(err);
    }
  },
};

export default familiaController;
