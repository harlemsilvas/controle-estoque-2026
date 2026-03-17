import { Request, Response, NextFunction } from 'express';
import * as usuarioService from '../services/usuarioService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'segredo_dev';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
      }
      const usuario = await usuarioService.buscarUsuarioPorEmail(email);
      if (!usuario) {
        return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
      }
      const senhaOk = await bcrypt.compare(password, usuario.password_hash || usuario.password);
      if (!senhaOk) {
        return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
      }
      // Não incluir hash no token
      const { id, username, email: userEmail, role } = usuario;
      const signOptions: jwt.SignOptions = { expiresIn: JWT_EXPIRES as any };
      const token = jwt.sign(
        { id, username, email: userEmail, role },
        JWT_SECRET as string,
        signOptions
      );
      res.json({ token, user: { id, username, email: userEmail, role } });
    } catch (err) {
      next(err);
    }
  },
};

export default authController;
