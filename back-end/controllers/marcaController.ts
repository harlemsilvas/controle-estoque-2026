import { Request, Response, NextFunction } from 'express';
import marcaService from '../services/marcaService';

/**
 * @swagger
 * tags:
 *   name: Marca
 *   description: Operações relacionadas a marcas
 */
const marcaController = {
  /**
   * @swagger
   * /marca:
   *   get:
   *     summary: Lista todas as marcas
   *     tags: [Marca]
   *     responses:
   *       200:
   *         description: Lista de marcas
   */
  async listarTodos(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const search = req.query.search ? String(req.query.search) : '';
      const orderBy = req.query.orderBy ? String(req.query.orderBy) : 'DESCRICAO';
      const orderDir = req.query.orderDir === 'desc' ? 'desc' : 'asc';
      const result = await marcaService.listarPaginado(page, limit, search, orderBy, orderDir);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
  /**
   * @swagger
   * /marca/{codigo}:
   *   get:
   *     summary: Busca uma marca pelo código
   *     tags: [Marca]
   *     parameters:
   *       - in: path
   *         name: codigo
   *         schema:
   *           type: integer
   *         required: true
   *         description: Código da marca
   *     responses:
   *       200:
   *         description: Marca encontrada
   *       404:
   *         description: Marca não encontrada
   */
  async buscarPorCodigo(req: Request, res: Response, next: NextFunction) {
    try {
      const codigo = parseInt(req.params.codigo, 10);
      const marca = await marcaService.buscarPorCodigo(codigo);
      res.json(marca);
    } catch (err) {
      next(err);
    }
  },
  /**
   * @swagger
   * /marca:
   *   post:
   *     summary: Cria uma nova marca
   *     tags: [Marca]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       201:
   *         description: Marca criada
   *       400:
   *         description: Erro de validação
   */
  async criar(req: Request, res: Response, next: NextFunction) {
    try {
      const novaMarca = await marcaService.criar(req.body);
      res.status(201).json(novaMarca);
    } catch (err) {
      next(err);
    }
  },
  /**
   * @swagger
   * /marca/{codigo}:
   *   put:
   *     summary: Atualiza uma marca existente
   *     tags: [Marca]
   *     parameters:
   *       - in: path
   *         name: codigo
   *         schema:
   *           type: integer
   *         required: true
   *         description: Código da marca
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Marca atualizada
   *       400:
   *         description: Erro de validação
   */
  async atualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const codigo = parseInt(req.params.codigo, 10);
      const marcaAtualizada = await marcaService.atualizar(codigo, req.body);
      res.json(marcaAtualizada);
    } catch (err) {
      next(err);
    }
  },
  /**
   * @swagger
   * /marca/{codigo}:
   *   delete:
   *     summary: Remove uma marca
   *     tags: [Marca]
   *     parameters:
   *       - in: path
   *         name: codigo
   *         schema:
   *           type: integer
   *         required: true
   *         description: Código da marca
   *     responses:
   *       204:
   *         description: Marca removida
   *       400:
   *         description: Erro ao remover
   */
  async remover(req: Request, res: Response, next: NextFunction) {
    try {
      const codigo = parseInt(req.params.codigo, 10);
      // Se vier ?force=true na query, faz remoção forçada
      const force = req.query.force === 'true';
      await marcaService.remover(codigo, force);
      res.status(204).send();
    } catch (err: any) {
      if (err.code === 'FK_PRODUTO_MARCA') {
        return res.status(400).json({
          message:
            'Não é possível remover: existem produtos vinculados a esta marca. Para forçar a remoção, utilize a opção de exclusão forçada.',
          code: err.code,
        });
      }
      next(err);
    }
  },
};

export default marcaController;
