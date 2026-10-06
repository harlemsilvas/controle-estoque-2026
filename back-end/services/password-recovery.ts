import { createHmac, randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import sql from 'mssql';
import nodemailer from 'nodemailer';
import { jwtSecret, passwordStamp } from '../middleware/session-security';
import * as users from './usuarioService';
import { connectToDatabase } from '../models/db';
const invalid = () => Object.assign(new Error('Link inválido, expirado ou já utilizado. Solicite outro.'), { status: 400 });
const recoveryKey = () => createHmac('sha256', jwtSecret()).update('controle-estoque/password-recovery/v1').digest('hex');
export function recoveryConfiguration() {
  if (process.env.PASSWORD_RECOVERY_ENABLED !== 'true') return null;
  const base = new URL(process.env.APP_PUBLIC_URL || '');
  if (base.protocol !== 'https:' && !(base.protocol === 'http:' && process.env.ALLOW_HTTP_PASSWORD_RECOVERY === 'true'))
    throw new Error('Configure APP_PUBLIC_URL HTTPS. HTTP exige autorização explícita para teste local.');
  if (base.username || base.password || base.pathname !== '/' || base.search || base.hash) throw new Error('APP_PUBLIC_URL deve ser a origem do frontend.');
  const port = Number(process.env.SMTP_PORT || 587);
  if (!process.env.SMTP_HOST || !process.env.MAIL_FROM || !Number.isInteger(port) || port < 1 || port > 65535
    || (!!process.env.SMTP_USER !== !!process.env.SMTP_PASSWORD)) throw new Error('Configuração SMTP incompleta.');
  return { base, port };
}
export function createRecoveryToken(user: { id?: number; password_hash?: string }) {
  return jwt.sign({ id: user.id, stamp: passwordStamp(user.password_hash!) }, recoveryKey(), {
    algorithm: 'HS256', expiresIn: '15m', jwtid: randomUUID(), audience: 'password-recovery', issuer: 'controle-estoque' });
}
export async function sendRecoveryEmail(to: string, link: string) {
  const config = recoveryConfiguration(); if (!config) throw new Error('Recuperação desativada.');
  const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: config.port,
    secure: config.port === 465, requireTLS: config.port !== 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD! } : undefined,
    connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 10000,
    disableFileAccess: true, disableUrlAccess: true, logger: false, debug: false });
  await transporter.sendMail({ from: process.env.MAIL_FROM, to,
    subject: 'Redefinição de senha — Controle de Estoque',
    text: `Foi solicitada uma nova senha. O link abaixo vale por 15 minutos e pode ser utilizado uma única vez.\n\n${link}\n\nSe não foi você, ignore este e-mail. Sua senha permanece igual.` });
}
export async function requestRecovery(email: string, deliver = sendRecoveryEmail) {
  const config = recoveryConfiguration();
  if (!config) throw Object.assign(new Error('Recuperação por e-mail indisponível. Solicite ajuda ao administrador.'), { status: 503 });
  const user = await users.buscarUsuarioPorEmail(email);
  if (user?.is_active && user.password_hash) {
    const link = new URL('/reset-password', config.base); link.hash = 'token=' + createRecoveryToken(user);
    // Resposta pública não depende do destinatário nem do tempo de entrega SMTP.
    void deliver(user.email, link.toString()).catch(() => console.error('Não foi possível entregar e-mail de recuperação; detalhes omitidos.'));
  }
}
export async function replacePassword(id: number, before: string, after: string) {
  const pool = await connectToDatabase();
  const result = await pool.request().input('id', sql.Int, id).input('before', sql.VarChar(255), before)
    .input('after', sql.VarChar(255), after).query(`UPDATE users SET password_hash=@after WHERE id=@id AND is_active=1
      AND password_hash COLLATE Latin1_General_100_BIN2 = @before COLLATE Latin1_General_100_BIN2`);
  return result.rowsAffected[0] === 1;
}
export async function resetPassword(token: unknown, password: unknown, replace = replacePassword) {
  if (typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72)
    throw Object.assign(new Error('A senha deve ter pelo menos 12 caracteres e no máximo 72 bytes.'), { status: 400 });
  if (typeof token !== 'string' || token.length > 2048) throw invalid();
  let payload: jwt.JwtPayload;
  try { payload = jwt.verify(token, recoveryKey(), { algorithms: ['HS256'], audience: 'password-recovery', issuer: 'controle-estoque' }) as jwt.JwtPayload; }
  catch { throw invalid(); }
  if (!Number.isSafeInteger(payload.id) || typeof payload.stamp !== 'string' || typeof payload.jti !== 'string' || typeof payload.exp !== 'number') throw invalid();
  const user = await users.buscarUsuarioPorId(payload.id);
  if (!user?.is_active || !user.password_hash || payload.stamp !== passwordStamp(user.password_hash)) throw invalid();
  const hash = await bcrypt.hash(password, 12);
  if (!await replace(payload.id, user.password_hash, hash)) throw invalid();
}
