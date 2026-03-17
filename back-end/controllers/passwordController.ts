import { Request, Response, NextFunction } from 'express';
import * as usuarioService from '../services/usuarioService';
import bcrypt from 'bcryptjs';

const passwordController = {
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, newPassword } = req.body;
      if (!email || !newPassword) {
        return res.status(400).json({ error: 'Email e nova senha são obrigatórios.' });
      }
      const usuario = await usuarioService.buscarUsuarioPorEmail(email);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      const hash = await bcrypt.hash(newPassword, 10);
      await usuarioService.atualizarSenhaUsuario(Number(usuario.id), hash);
      res.json({ message: 'Senha redefinida com sucesso!' });
    } catch (err) {
      next(err);
    }
  },

  // Endpoint temporário para debug: força a senha de um usuário para um valor conhecido
  async forcarSenha(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, senha } = req.body;
      if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
      }
      const usuario = await usuarioService.buscarUsuarioPorEmail(email);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      const hash = await bcrypt.hash(senha, 10);
      await usuarioService.atualizarSenhaUsuario(Number(usuario.id), hash);
      res.json({ message: 'Senha forçada com sucesso para debug.' });
    } catch (err) {
      next(err);
    }
  },
};

export default passwordController;
