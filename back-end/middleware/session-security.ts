import 'dotenv/config';
import { createHmac } from 'crypto';
import fs from 'fs';
import path from 'path';

export function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET precisa ter pelo menos 32 caracteres.');
  return secret;
}
export function passwordStamp(hash: string): string {
  return createHmac('sha256', jwtSecret()).update(hash).digest('hex');
}
const file = process.env.SESSION_REVOCATION_FILE || path.join(process.cwd(), 'logs/session-revocations.json');
let revoked: Record<string, number> = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
export function isRevoked(id: string): boolean { return (revoked[id] || 0) > Date.now() / 1000; }
export function revokeSession(id: string, expiry: number): void {
  revoked = Object.fromEntries(Object.entries(revoked).filter(([, until]) => until > Date.now() / 1000));
  revoked[id] = expiry;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + '.tmp', JSON.stringify(revoked), { mode: 0o600 });
  fs.renameSync(file + '.tmp', file);
}
