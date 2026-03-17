import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: any;
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.error('Token não fornecido.');
    return res.status(401).json({ error: 'Acesso negado. Token ausente.' });
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
    if (err) {
      console.error('Erro ao verificar token:', (err as Error).message);
      return res.status(403).json({ error: 'Token inválido.' });
    }
    req.user = user;
    console.log('🚀 ~ jwt.verify ~ user:', user);
    next();
  });
};

export default authenticateToken;
