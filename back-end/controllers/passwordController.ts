import { Request, Response, NextFunction } from 'express';
import { requestRecovery, resetPassword } from '../services/password-recovery';
export async function recover(req: Request, res: Response, next: NextFunction) {
  try {
    const email = req.body?.email;
    if (typeof email !== 'string' || email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return res.status(400).json({ error: 'Informe um e-mail válido.' });
    await requestRecovery(email.trim());
    res.status(202).json({ message: 'Se o e-mail corresponder a uma conta ativa, você receberá as instruções de recuperação.' });
  } catch (error) { next(error); }
}
export async function reset(req: Request, res: Response, next: NextFunction) {
  try { await resetPassword(req.body?.token, req.body?.newPassword); res.json({ message: 'Senha atualizada. Entre novamente.' }); }
  catch (error) { next(error); }
}
