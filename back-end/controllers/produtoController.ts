import { Request, Response, NextFunction } from 'express';
import produtoService from '../services/produtoService';
import produtoVinculoService from '../services/produtoVinculoService';

/**
 * @swagger
 * tags:
 *   name: Produto
 *   description: Operações relacionadas a produtos
 */
const produtoController = {
  async getProdutoPorBarcode(req: Request, res: Response, next: NextFunction) {
    try {
      const { barcode } = req.params;
      const produto = await produtoService.getProdutoPorBarcode(barcode);
      if (!produto) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }
      res.json(produto);
    } catch (err) {
      next(err);
    }
  },
  /**
   * @swagger
   * /produto/estoque:
   *   get:
   *     summary: Retorna dados de estoque dos produtos
   *     tags: [Produto]
   *     responses:
   *       200:
   *         description: Dados de estoque
   */
  async getEstoque(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await produtoService.getEstoque();
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
  /**
   * @swagger
   * /produto-aggregate:
   *   get:
   *     summary: Retorna agregações de produtos por família, marca e fornecedor
   *     tags: [Produto]
   *     responses:
   *       200:
   *         description: Dados agregados
   */
  async aggregate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await produtoService.aggregate();
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
  /**
   * @swagger
   * /produto:
   *   get:
   *     summary: Lista todos os produtos
   *     tags: [Produto]
   *     responses:
   *       200:
   *         description: Lista de produtos
   */
  async listarTodos(req: Request, res: Response, next: NextFunction) {
    try {
      // Obter parâmetros de paginação, filtro e ordenação da query string
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const offset = (page - 1) * limit;

      const fornecedor = req.query.fornecedor as string | undefined;
      const marca = req.query.marca as string | undefined;
      const orderBy = (req.query.orderBy as string) || 'CODIGO';
      const orderDir =
        ((req.query.orderDir as string) || 'asc').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      // Buscar produtos paginados, filtrando e ordenando
      const search = req.query.search as string | undefined;
      const { produtos, total } = await produtoService.listarTodos({
        offset,
        limit,
        fornecedor,
        marca,
        search,
        orderBy,
        orderDir,
      });

      res.json({
        data: produtos,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      next(err);
    }
  },
  /**
   * @swagger
   * /produto/{codigo}:
   *   get:
   *     summary: Busca um produto pelo código
   *     tags: [Produto]
   *     parameters:
   *       - in: path
   *         name: codigo
   *         schema:
   *           type: integer
   *         required: true
   *         description: Código do produto
   *     responses:
   *       200:
   *         description: Produto encontrado
   *       404:
   *         description: Produto não encontrado
   */
  async buscarPorCodigo(req: Request, res: Response, next: NextFunction) {
    try {
      const codigo = parseInt(req.params.codigo, 10);
      const produto = await produtoService.buscarPorCodigo(codigo);
      res.json(produto);
    } catch (err) {
      next(err);
    }
  },
  /**
   * @swagger
   * /produto:
   *   post:
   *     summary: Cria um novo produto
   *     tags: [Produto]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       201:
   *         description: Produto criado
   *       400:
   *         description: Erro de validação
   */
  async criar(req: Request, res: Response, next: NextFunction) {
    try {
      const novoProduto = await produtoService.criar(req.body);
      res.status(201).json(novoProduto);
    } catch (err) {
      next(err);
    }
  },
  /**
   * @swagger
   * /produto/{codigo}:
   *   put:
   *     summary: Atualiza um produto existente
   *     tags: [Produto]
   *     parameters:
   *       - in: path
   *         name: codigo
   *         schema:
   *           type: integer
   *         required: true
   *         description: Código do produto
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Produto atualizado
   *       400:
   *         description: Erro de validação
   */
  async atualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const codigo = parseInt(req.params.codigo, 10);
      const produtoAtualizado = await produtoService.atualizar(codigo, req.body);
      res.json(produtoAtualizado);
    } catch (err) {
      next(err);
    }
  },
  /**
   * @swagger
   * /produto/{codigo}:
   *   delete:
   *     summary: Remove um produto
   *     tags: [Produto]
   *     parameters:
   *       - in: path
   *         name: codigo
   *         schema:
   *           type: integer
   *         required: true
   *         description: Código do produto
   *     responses:
   *       204:
   *         description: Produto removido
   *       400:
   *         description: Erro ao remover
   */
  async remover(req: Request, res: Response, next: NextFunction) {
    try {
      const codigo = parseInt(req.params.codigo, 10);
      await produtoService.remover(codigo);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  // Lixeira: lista produtos deletados
  async listarLixeira(req: Request, res: Response, next: NextFunction) {
    try {
      const produtos = await produtoService.listarLixeira();
      res.json(produtos);
    } catch (err) {
      next(err);
    }
  },

  // Lixeira: conta produtos deletados
  async contarLixeira(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await produtoService.contarLixeira();
      res.json({ count });
    } catch (err) {
      next(err);
    }
  },

  // Lixeira: restaurar produto
  async restaurarProduto(req: Request, res: Response, next: NextFunction) {
    try {
      const codigo = parseInt(req.params.id, 10);
      await produtoService.restaurarProduto(codigo);
      res.status(200).json({ codigo });
    } catch (err) {
      next(err);
    }
  },

  // Lixeira: excluir permanentemente
  async excluirPermanentemente(req: Request, res: Response, next: NextFunction) {
    try {
      const codigo = parseInt(req.params.id, 10);
      const cascade = req.query.cascade === 'true';
      try {
        await produtoService.excluirPermanentemente(codigo);
        return res.status(204).send();
      } catch (err: any) {
        // Se for erro de constraint, buscar vínculos e retornar
        if (err.message && err.message.includes('REFERENCE constraint')) {
          const vinculos = await produtoVinculoService.listarVinculosProduto(codigo);
          if (!cascade) {
            return res.status(409).json({
              error:
                'Existem registros vinculados a este produto. Para excluir em cascata, envie ?cascade=true',
              vinculos,
            });
          } else {
            // Excluir vínculos e tentar novamente
            await produtoVinculoService.excluirVinculosProduto(codigo);
            await produtoService.excluirPermanentemente(codigo);
            return res.status(204).send();
          }
        }
        throw err;
      }
    } catch (err) {
      next(err);
    }
  },

  // Busca produtos por termo (query param "termo")
  async buscarProdutos(req: Request, res: Response, next: NextFunction) {
    try {
      const termo = (req.query.termo as string) || '';
      const produtos = await produtoService.buscarProdutos(termo);
      res.json(produtos);
    } catch (err) {
      next(err);
    }
  },
};

export default produtoController;
