import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
export function recoveryLimit() {
  const entries = new Map<string, { count: number; until: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now(); for (const [key, entry] of entries) if (entry.until <= now) entries.delete(key);
    const keys = ['ip:' + req.ip];
    if (typeof req.body?.email === 'string') keys.push('email:' + createHash('sha256').update(req.body.email.trim().toLowerCase()).digest('hex'));
    if (entries.size > 10000 || keys.some(key => (entries.get(key)?.count || 0) >= 5)) {
      res.setHeader('Retry-After', '900'); return res.status(429).json({ error: 'Muitas tentativas. Aguarde antes de tentar novamente.' });
    }
    for (const key of keys) { const entry = entries.get(key) || { count: 0, until: now + 900000 }; entry.count++; entries.set(key, entry); }
    next();
  };
}
