export async function atualizarDadosUsuario(
  id: number,
  username: string,
  email: string
): Promise<void> {
  const pool = await connectToDatabase();
  await pool
    .request()
    .input('id', sql.Int, id)
    .input('username', sql.VarChar(50), username)
    .input('email', sql.VarChar(100), email)
    .query('UPDATE users SET username = @username, email = @email WHERE id = @id');
}
export async function atualizarRoleUsuario(id: number, role: string): Promise<void> {
  const pool = await connectToDatabase();
  await pool
    .request()
    .input('id', sql.Int, id)
    .input('role', sql.VarChar(20), role)
    .query('UPDATE users SET role = @role WHERE id = @id');
}
export async function atualizarStatusUsuario(id: number, is_active: boolean): Promise<void> {
  const pool = await connectToDatabase();
  await pool
    .request()
    .input('id', sql.Int, id)
    .input('is_active', sql.Bit, is_active ? 1 : 0)
    .query('UPDATE users SET is_active = @is_active WHERE id = @id');
}
import sql from 'mssql';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../models/db';

export interface Usuario {
  id?: number;
  username: string;
  email: string;
  password: string; // plain text para cadastro
  password_hash?: string; // hash retornado do banco
  role?: string;
  created_at?: Date;
  is_active?: boolean;
}

export async function criarUsuario(data: Usuario): Promise<Omit<Usuario, 'password'>> {
  const pool = await connectToDatabase();
  const hash = await bcrypt.hash(data.password, 10);
  const result = await pool
    .request()
    .input('username', sql.VarChar(50), data.username)
    .input('email', sql.VarChar(100), data.email)
    .input('password_hash', sql.VarChar(255), hash)
    .query(
      `INSERT INTO users (username, email, password_hash) OUTPUT INSERTED.id, INSERTED.username, INSERTED.email, INSERTED.role, INSERTED.created_at, INSERTED.is_active VALUES (@username, @email, @password_hash)`
    );
  return result.recordset[0];
}

export async function buscarUsuarioPorEmail(email: string): Promise<Usuario | null> {
  const pool = await connectToDatabase();
  const result = await pool
    .request()
    .input('email', sql.VarChar(100), email)
    .query('SELECT * FROM Users WHERE email = @email');
  return result.recordset[0] || null;
}

export async function buscarUsuarioPorUsername(username: string): Promise<Usuario | null> {
  const pool = await connectToDatabase();
  const result = await pool
    .request()
    .input('username', sql.VarChar(50), username)
    .query('SELECT * FROM users WHERE username = @username');
  return result.recordset[0] || null;
}

export async function listarUsuarios(): Promise<Omit<Usuario, 'password'>[]> {
  const pool = await connectToDatabase();
  const result = await pool
    .request()
    .query('SELECT id, username, email, role, created_at, is_active FROM users');
  return result.recordset;
}

export async function atualizarSenhaUsuario(id: number, hash: string): Promise<void> {
  const pool = await connectToDatabase();
  await pool
    .request()
    .input('id', sql.Int, id)
    .input('password_hash', sql.VarChar(255), hash)
    .query('UPDATE users SET password_hash = @password_hash WHERE id = @id');
}
