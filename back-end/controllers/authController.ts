import { Request, Response, NextFunction } from 'express';
import * as users from '../services/usuarioService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { profilePermissions } from '../services/access-profiles';
import { randomUUID } from 'crypto';
import { jwtSecret, passwordStamp } from '../middleware/session-security';
const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body || {};
      if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password || email.length > 100 || password.length > 200)
        return res.status(400).json({ error: 'Informe email e senha válidos.' });
      const user = await users.buscarUsuarioPorEmail(email.trim());
      if (!user?.is_active || !user.password_hash || !await bcrypt.compare(password, user.password_hash))
        return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
      const token = jwt.sign({ id: user.id, passwordStamp: passwordStamp(user.password_hash) }, jwtSecret(),
        { algorithm: 'HS256', expiresIn: (process.env.JWT_EXPIRES || '8h') as jwt.SignOptions['expiresIn'], jwtid: randomUUID() });
      const access = await profilePermissions(user.role || 'user');
      return res.json({ token, user: { ...access, profileName: access.name, id: user.id, username: user.username, email: user.email, role: user.role || 'user' } });
    } catch (err) { next(err); }
  },
};
export default authController;
