import sql from 'mssql';

export interface Usuario {
  id?: number;
  username: string;
  email: string;
  password: string; // hash
  created_at?: Date;
}

export async function criarTabelaUsuario(pool: sql.ConnectionPool) {
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Usuarios' and xtype='U')
    CREATE TABLE Usuarios (
      id INT IDENTITY(1,1) PRIMARY KEY,
      username NVARCHAR(100) NOT NULL UNIQUE,
      email NVARCHAR(200) NOT NULL UNIQUE,
      password NVARCHAR(200) NOT NULL,
      created_at DATETIME DEFAULT GETDATE()
    )
  `);
}
