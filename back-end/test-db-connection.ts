import 'dotenv/config';
import { connectToDatabase, dbConfig } from './models/db';

async function main() {
  console.log('Iniciando teste de conexão com o banco de dados...');
  console.log('Servidor:', dbConfig.server);
  console.log('Banco de dados:', dbConfig.database);
  console.log('Usuário:', dbConfig.user);

  try {
    const pool = await connectToDatabase();

    // Executa uma query simples apenas para validar a conexão
    const result = await pool.request().query('SELECT 1 AS ok');

    console.log('Conexão bem-sucedida!');
    console.log('Resposta do banco:', result.recordset);
    process.exit(0);
  } catch (error) {
    console.error('Falha ao conectar ao banco de dados.');
    console.error(error);
    process.exit(1);
  }
}

main();
