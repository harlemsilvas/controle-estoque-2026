import 'dotenv/config';
import sql from 'mssql';

for (const name of ['DB_USER', 'DB_PASSWORD', 'DB_SERVER', 'DB_NAME']) {
  if (!process.env[name]) throw new Error(`Configuração obrigatória ausente: ${name}`);
}
export const dbConfig: sql.config = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  server: process.env.DB_SERVER!,
  database: process.env.DB_NAME!,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
};

let pool: sql.ConnectionPool | null = null;

export async function connectToDatabase() {
  if (!pool) {
    pool = await sql.connect(dbConfig);
  }
  return pool;
}
