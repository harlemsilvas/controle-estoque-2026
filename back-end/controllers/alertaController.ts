import { Request, Response, NextFunction } from 'express';
import alertaService from '../services/alertaService';

const alertaController = {
  async historico(req: Request, res: Response, next: NextFunction) {
    try {
      const historico = await alertaService.getHistorico();
      res.json(historico);
    } catch (err) {
      next(err);
    }
  },

  async ativos(req: Request, res: Response, next: NextFunction) {
    try {
      const ativos = await alertaService.getAlertasAtivos();
      res.json(ativos);
    } catch (err) {
      next(err);
    }
  },

  async resolverAlerta(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const usuario = req.body?.usuario || '';
      if (!id || !usuario) {
        return res.status(400).json({ error: 'ID ou usuário inválido' });
      }
      const ok = await alertaService.resolverAlerta(id, usuario);
      if (ok) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Alerta não encontrado' });
      }
    } catch (err) {
      next(err);
    }
  },
};

export default alertaController;
