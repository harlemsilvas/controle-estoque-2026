import { Request, Response, NextFunction } from 'express';
import estoqueService from '../services/estoqueService';

const badRequest = (message: string) => {
  const error = new Error(message) as Error & { status?: number };
  error.status = 400;
  return error;
};

const estoqueController = {
  // Valor total geral do estoque
  async getValorTotalEstoque(req: Request, res: Response, next: NextFunction) {
    try {
      const valor = await estoqueService.getValorTotalEstoque();
      res.json({ valor_total: valor });
    } catch (err) {
      next(err);
    }
  },

  // Valor total por família
  async getValorTotalPorFamilia(req: Request, res: Response, next: NextFunction) {
    try {
      const valores = await estoqueService.getValorTotalPorFamilia();
      res.json(valores);
    } catch (err) {
      next(err);
    }
  },

  // Valor total por marca
  async getValorTotalPorMarca(req: Request, res: Response, next: NextFunction) {
    try {
      const valores = await estoqueService.getValorTotalPorMarca();
      res.json(valores);
    } catch (err) {
      next(err);
    }
  },

  // Valor total por fornecedor
  async getValorTotalPorFornecedor(req: Request, res: Response, next: NextFunction) {
    try {
      const valores = await estoqueService.getValorTotalPorFornecedor();
      res.json(valores);
    } catch (err) {
      next(err);
    }
  },
  async getHistoricoPorBarcode(req: Request, res: Response, next: NextFunction) {
    try {
      const { barcode } = req.params;
      const historico = await estoqueService.getHistoricoPorBarcode(barcode);
      res.json(historico);
    } catch (err) {
      next(err);
    }
  },

  // Movimentação por código do produto
  async movimentarEstoque(req: Request, res: Response, next: NextFunction) {
    try {
      const { codigoProduto, tipo, quantidade, usuario } = req.body;

      const codigoProdutoNum = Number(codigoProduto);
      const quantidadeNum = Number(quantidade);
      const tipoNormalizado = String(tipo || '').trim().toUpperCase();
      const usuarioNormalizado = String(usuario || '').trim();

      if (!Number.isInteger(codigoProdutoNum) || codigoProdutoNum <= 0) {
        throw badRequest('codigoProduto inválido');
      }
      if (!['E', 'S', 'I'].includes(tipoNormalizado)) {
        throw badRequest('tipo inválido. Use E, S ou I');
      }
      if (!Number.isFinite(quantidadeNum) || quantidadeNum < 0) {
        throw badRequest('quantidade inválida');
      }
      if (!usuarioNormalizado) {
        throw badRequest('usuario é obrigatório');
      }

      const resultado = await estoqueService.registrarMovimentacaoPorCodigo({
        codigoProduto: codigoProdutoNum,
        tipo: tipoNormalizado,
        quantidade: quantidadeNum,
        usuario: usuarioNormalizado,
      });
      res.status(201).json(resultado);
    } catch (err) {
      next(err);
    }
  },

  // Movimentação por código de barras
  async movimentarPorBarcode(req: Request, res: Response, next: NextFunction) {
    try {
      const { codigo_barras, tipo, quantidade, usuario } = req.body;

      const quantidadeNum = Number(quantidade);
      const tipoNormalizado = String(tipo || '').trim().toUpperCase();
      const barcodeNormalizado = String(codigo_barras || '').trim();
      const usuarioNormalizado = String(usuario || '').trim();

      if (!barcodeNormalizado) {
        throw badRequest('codigo_barras é obrigatório');
      }
      if (!['E', 'S', 'I'].includes(tipoNormalizado)) {
        throw badRequest('tipo inválido. Use E, S ou I');
      }
      if (!Number.isFinite(quantidadeNum) || quantidadeNum < 0) {
        throw badRequest('quantidade inválida');
      }
      if (!usuarioNormalizado) {
        throw badRequest('usuario é obrigatório');
      }

      const resultado = await estoqueService.registrarMovimentacaoPorBarcode({
        codigo_barras: barcodeNormalizado,
        tipo: tipoNormalizado,
        quantidade: quantidadeNum,
        usuario: usuarioNormalizado,
      });
      res.status(201).json(resultado);
    } catch (err) {
      next(err);
    }
  },

  // Retorna os 15 produtos com mais e menos estoque
  async getEstoqueResumo(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await estoqueService.getEstoqueResumo();
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};

export default estoqueController;
