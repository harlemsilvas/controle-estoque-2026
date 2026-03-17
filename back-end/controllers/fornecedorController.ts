import { Request, Response, NextFunction } from 'express';
import fornecedorService from '../services/fornecedorService';

/**
 * @swagger
 * tags:
 *   name: Fornecedor
 *   description: Operações relacionadas a fornecedores
 */
const fornecedorController = {
  /**
   * @swagger
   * /fornecedor:
   *   get:
   *     summary: Lista todos os fornecedores
   *     tags: [Fornecedor]
   *     responses:
   *       200:
   *         description: Lista de fornecedores
   */
  async listarTodos(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const search = req.query.search ? String(req.query.search) : '';
      const orderBy = req.query.orderBy ? String(req.query.orderBy) : 'NOME';
      const orderDir = req.query.orderDir === 'desc' ? 'desc' : 'asc';
      const fornecedores = await fornecedorService.listarTodos({
        page,
        limit,
        search,
        orderBy,
        orderDir,
      });
      res.json(fornecedores);
    } catch (err) {
      next(err);
    }
  },
  /**
   * @swagger
   * /fornecedor/{codigo}:
   *   get:
   *     summary: Busca um fornecedor pelo código
   *     tags: [Fornecedor]
   *     parameters:
   *       - in: path
   *         name: codigo
   *         schema:
   *           type: integer
   *         required: true
   *         description: Código do fornecedor
   *     responses:
   *       200:
   *         description: Fornecedor encontrado
   *       404:
   *         description: Fornecedor não encontrado
   */
  async buscarPorCodigo(req: Request, res: Response, next: NextFunction) {
    try {
      const codigo = parseInt(req.params.codigo, 10);
      const fornecedor = await fornecedorService.buscarPorCodigo(codigo);
      res.json(fornecedor);
    } catch (err) {
      next(err);
    }
  },
  /**
   * @swagger
   * /fornecedor:
   *   post:
   *     summary: Cria um novo fornecedor
   *     tags: [Fornecedor]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       201:
   *         description: Fornecedor criado
   *       400:
   *         description: Erro de validação
   */
  async criar(req: Request, res: Response, next: NextFunction) {
    try {
      const novoFornecedor = await fornecedorService.criar(req.body);
      res.status(201).json(novoFornecedor);
    } catch (err) {
      next(err);
    }
  },
  /**
   * @swagger
   * /fornecedor/{codigo}:
   *   put:
   *     summary: Atualiza um fornecedor existente
   *     tags: [Fornecedor]
   *     parameters:
   *       - in: path
   *         name: codigo
   *         schema:
   *           type: integer
   *         required: true
   *         description: Código do fornecedor
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Fornecedor atualizado
   *       400:
   *         description: Erro de validação
   */
  async atualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const codigo = parseInt(req.params.codigo, 10);
      const fornecedorAtualizado = await fornecedorService.atualizar(codigo, req.body);
      res.json(fornecedorAtualizado);
    } catch (err) {
      next(err);
    }
  },
  /**
   * @swagger
   * /fornecedor/{codigo}:
   *   delete:
   *     summary: Remove um fornecedor
   *     tags: [Fornecedor]
   *     parameters:
   *       - in: path
   *         name: codigo
   *         schema:
   *           type: integer
   *         required: true
   *         description: Código do fornecedor
   *     responses:
   *       204:
   *         description: Fornecedor removido
   *       400:
   *         description: Erro ao remover
   */
  async remover(req: Request, res: Response, next: NextFunction) {
    try {
      const codigo = parseInt(req.params.codigo, 10);
      // Se vier ?force=true na query, faz remoção forçada
      const force = req.query.force === 'true';
      await fornecedorService.remover(codigo, force);
      res.status(204).send();
    } catch (err) {
      console.error('Erro ao remover fornecedor:', err);
      interface FornecedorError extends Error {
        code?: string;
        vinculos?: unknown[];
      }
      const fornecedorErr = err as FornecedorError;
      if (fornecedorErr.code === 'FK_PRODUTO_FORNECEDOR') {
        return res.status(409).json({
          message:
            fornecedorErr.message ||
            'Não é possível remover: existem produtos vinculados a este fornecedor. Para forçar a remoção, utilize a opção de exclusão forçada.',
          code: fornecedorErr.code,
          vinculos: fornecedorErr.vinculos || [],
        });
      }
      next(err);
    }
  },
};

export default fornecedorController;
