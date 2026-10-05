const path = require('path');
const envPath = path.resolve(process.argv[2] || '.env');
require('dotenv').config({ path: envPath });
const sql = require('mssql');
(async () => {
  for (const key of ['DB_USER', 'DB_PASSWORD', 'DB_SERVER', 'DB_NAME']) {
    if (!process.env[key]) throw new Error(`Configuracao ausente: ${key}`);
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET exige pelo menos 32 caracteres.');
  const pool = await sql.connect({ user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, database: process.env.DB_NAME,
    options: { encrypt: process.env.DB_ENCRYPT === 'true', trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true' } });
  try {
    const query = require('fs').readFileSync(path.join(__dirname, '../sql/patch-access-profiles-verify.sql'), 'utf8');
    await pool.request().query(query);
    console.log('PASS: configuracao, conexao e estrutura de perfis verificadas; nenhuma alteracao no banco.');
  } finally { await pool.close(); }
})().catch(() => { console.error('Preflight falhou: confira DB_*, JWT_SECRET e a estrutura AccessProfiles/AccessProfileAudit no banco configurado. Valores sensiveis omitidos.'); process.exitCode = 1; });
