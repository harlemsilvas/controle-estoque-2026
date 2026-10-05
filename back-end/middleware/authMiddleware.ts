import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { profilePermissions } from '../services/access-profiles';
import * as users from '../services/usuarioService';
import { jwtSecret, passwordStamp, isRevoked } from './session-security';
export interface AuthRequest extends Request {
  user?: { id: number; username: string; email: string; role: string; profileName: string; permissions: string[] };
  session?: { id: string; expiry: number };
}
export default async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Autenticação necessária.' });
  try {
    const payload = jwt.verify(token, jwtSecret(), { algorithms: ['HS256'] }) as jwt.JwtPayload;
    if (!Number.isSafeInteger(payload.id) || typeof payload.exp !== 'number' || typeof payload.jti !== 'string' || typeof payload.passwordStamp !== 'string' || isRevoked(payload.jti))
      return res.status(401).json({ error: 'Sessão inválida. Entre novamente.' });
    const user = await users.buscarUsuarioPorId(payload.id);
    if (!user || !user.is_active || !user.password_hash || payload.passwordStamp !== passwordStamp(user.password_hash))
      return res.status(401).json({ error: 'Sessão inválida ou usuário inativo.' });
    const access = await profilePermissions(user.role || 'user');
    req.user = { ...access, profileName: access.name, id: Number(user.id), username: user.username, email: user.email, role: user.role || 'user' };
    req.session = { id: payload.jti, expiry: payload.exp };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    next(error);
  }
}
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Esta operação exige perfil administrador.' });
  next();
}

export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.permissions.includes(permission)) return res.status(403).json({ error: 'Seu perfil não permite esta ação.' });
    next();
  };
}
