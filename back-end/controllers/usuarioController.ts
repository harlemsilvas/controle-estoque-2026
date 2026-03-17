import { Request, Response, NextFunction } from 'express';
import * as usuarioService from '../services/usuarioService';
import bcrypt from 'bcryptjs';

const usuarioController = {
  async atualizarDados(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { username, email } = req.body;
      if (!username || !email) {
        return res.status(400).json({ error: 'Nome de usuário e email são obrigatórios.' });
      }
      await usuarioService.atualizarDadosUsuario(Number(id), username, email);
      res.json({ message: 'Dados do usuário atualizados com sucesso.' });
    } catch (err) {
      next(err);
    }
  },
  async atualizarRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      if (!role || (role !== 'admin' && role !== 'user')) {
        return res.status(400).json({ error: 'Role inválido. Use "admin" ou "user".' });
      }
      await usuarioService.atualizarRoleUsuario(Number(id), role);
      res.json({ message: 'Permissão do usuário atualizada com sucesso.' });
    } catch (err) {
      next(err);
    }
  },
  async listarTodos(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarios = await usuarioService.listarUsuarios();
      res.json(usuarios);
    } catch (err) {
      next(err);
    }
  },

  async criar(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, email, password } = req.body;
      // Verifica se já existe usuário com mesmo email ou username
      const existenteEmail = await usuarioService.buscarUsuarioPorEmail(email);
      if (existenteEmail) {
        return res.status(400).json({ error: 'Este email já está registrado.' });
      }
      const existenteUsername = await usuarioService.buscarUsuarioPorUsername(username);
      if (existenteUsername) {
        return res.status(400).json({ error: 'Este nome de usuário já está registrado.' });
      }
      const usuario = await usuarioService.criarUsuario({ username, email, password });
      res.status(201).json({ message: 'Usuário criado com sucesso!', usuario });
    } catch (err) {
      next(err);
    }
  },

  async atualizarStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      if (typeof is_active !== 'boolean') {
        return res.status(400).json({ error: 'O campo is_active deve ser boolean.' });
      }
      await usuarioService.atualizarStatusUsuario(Number(id), is_active);
      res.json({ message: 'Status do usuário atualizado com sucesso.' });
    } catch (err) {
      next(err);
    }
  },

  async atualizarSenha(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      if (!newPassword) {
        return res.status(400).json({ error: 'Nova senha é obrigatória.' });
      }
      const hash = await bcrypt.hash(newPassword, 10);
      await usuarioService.atualizarSenhaUsuario(Number(id), hash);
      res.json({ message: 'Senha atualizada com sucesso!' });
    } catch (err) {
      next(err);
    }
  },
};

export default usuarioController;
