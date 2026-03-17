import sql from 'mssql';

export const dbConfig: sql.config = {
  user: process.env.DB_USER || 'harlem',
  password: process.env.DB_PASSWORD || 'xlaver',
  // server: 'HARLEM-NOTE',
  server: process.env.DB_SERVER || 'SERVER-ABC',
  database: process.env.DB_NAME || 'HRM',
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
