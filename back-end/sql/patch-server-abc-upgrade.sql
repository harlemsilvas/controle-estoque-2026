-- PATCH DE ATUALIZAÇÃO PARA O BANCO "server-abc" (sem alterações de IDENTITY)
-- Execute com cautela e faça backup antes!

-- 1. Adicionar tabelas que faltam

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ALERTAS_ESTOQUE')
BEGIN
CREATE TABLE [dbo].[ALERTAS_ESTOQUE](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[CODIGO_PRODUTO] [int] NOT NULL,
	[TIPO_ALERTA] [varchar](20) NOT NULL,
	[STATUS] [varchar](10) NOT NULL,
	[DATA_CRIACAO] [datetime] NOT NULL,
	[DATA_RESOLUCAO] [datetime] NULL,
	[USUARIO_NOTIFICADO] [varchar](50) NULL,
PRIMARY KEY CLUSTERED ([ID] ASC)
)
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FORNECEDOR')
BEGIN
CREATE TABLE [dbo].[FORNECEDOR](
	[CODIGO] [int] IDENTITY(1,1) NOT NULL,
	[NOME] [varchar](100) NOT NULL,
	[CNPJ] [varchar](18) NULL,
	[TELEFONE] [varchar](20) NULL,
	[EMAIL] [varchar](100) NULL,
	[ENDERECO] [varchar](200) NULL,
PRIMARY KEY CLUSTERED ([CODIGO] ASC),
UNIQUE NONCLUSTERED ([CNPJ] ASC)
)
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PasswordResetTokens')
BEGIN
CREATE TABLE [dbo].[PasswordResetTokens](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[user_id] [int] NOT NULL,
	[token] [nvarchar](255) NOT NULL,
	[expires_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED ([id] ASC)
)
END
GO

-- 2. Ajustar colunas das tabelas existentes

-- PRODUTO: adicionar colunas extras se não existirem
IF COL_LENGTH('PRODUTO', 'DELETADO_EM') IS NULL
	ALTER TABLE [dbo].[PRODUTO] ADD [DELETADO_EM] [datetime] NULL
GO
IF COL_LENGTH('PRODUTO', 'VALOR_UNITARIO') IS NULL
	ALTER TABLE [dbo].[PRODUTO] ADD [VALOR_UNITARIO] [decimal](10,2) NOT NULL CONSTRAINT DF_PRODUTO_VALOR_UNITARIO DEFAULT(0)
GO
IF COL_LENGTH('PRODUTO', 'COD_FORNECEDOR') IS NULL
	ALTER TABLE [dbo].[PRODUTO] ADD [COD_FORNECEDOR] [int] NULL
GO
IF COL_LENGTH('PRODUTO', 'DELETADO') IS NULL
	ALTER TABLE [dbo].[PRODUTO] ADD [DELETADO] [bit] NOT NULL CONSTRAINT DF_PRODUTO_DELETADO DEFAULT(0)
GO

-- PRODUTO: garantir defaults
IF NOT EXISTS (SELECT * FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('PRODUTO') AND name = 'DF_PRODUTO_CODIGO_MARCA')
	ALTER TABLE [dbo].[PRODUTO] ADD CONSTRAINT DF_PRODUTO_CODIGO_MARCA DEFAULT(1) FOR [CODIGO_MARCA]
GO

-- PRODUTO: garantir FKs
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_PRODUTO_FORNECEDOR')
	ALTER TABLE [dbo].[PRODUTO] ADD CONSTRAINT FK_PRODUTO_FORNECEDOR FOREIGN KEY([COD_FORNECEDOR]) REFERENCES [dbo].[FORNECEDOR]([CODIGO])
GO

-- FAMILIA_PRODUTO: aumentar tamanho do campo DESCRICAO
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('FAMILIA_PRODUTO') AND name = 'DESCRICAO' AND max_length < 255)
	ALTER TABLE [dbo].[FAMILIA_PRODUTO] ALTER COLUMN [DESCRICAO] [varchar](255) NOT NULL
GO

-- MARCA_PRODUTO: aumentar tamanho do campo DESCRICAO
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('MARCA_PRODUTO') AND name = 'DESCRICAO' AND max_length < 255)
	ALTER TABLE [dbo].[MARCA_PRODUTO] ALTER COLUMN [DESCRICAO] [varchar](255) NOT NULL
GO

-- ESTOQUE_PRODUTO: garantir default para USUARIO
IF NOT EXISTS (SELECT * FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('ESTOQUE_PRODUTO') AND name = 'DF_ESTOQUE_PRODUTO_USUARIO')
	ALTER TABLE [dbo].[ESTOQUE_PRODUTO] ADD CONSTRAINT DF_ESTOQUE_PRODUTO_USUARIO DEFAULT('HRM') FOR [USUARIO]
GO

-- users: garantir is_active NOT NULL e default
-- Primeiro, ajustar registros antigos que estejam nulos
UPDATE [dbo].[users]
	 SET [is_active] = 1
 WHERE [is_active] IS NULL;
GO

-- Agora sim, alterar a coluna para NOT NULL
ALTER TABLE [dbo].[users] ALTER COLUMN [is_active] [bit] NOT NULL;
GO
IF NOT EXISTS (
	SELECT 1
	FROM sys.default_constraints dc
	JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
	WHERE dc.parent_object_id = OBJECT_ID('dbo.users')
	  AND c.name = 'is_active'
)
	ALTER TABLE [dbo].[users] ADD CONSTRAINT DF_users_is_active DEFAULT(1) FOR [is_active]
GO



-- users: garantir defaults para role e created_at
IF NOT EXISTS (
	SELECT 1
	FROM sys.default_constraints dc
	JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
	WHERE dc.parent_object_id = OBJECT_ID('dbo.users')
	  AND c.name = 'role'
)
	ALTER TABLE [dbo].[users] ADD CONSTRAINT DF_users_role DEFAULT('user') FOR [role]
GO
IF NOT EXISTS (
	SELECT 1
	FROM sys.default_constraints dc
	JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
	WHERE dc.parent_object_id = OBJECT_ID('dbo.users')
	  AND c.name = 'created_at'
)
	ALTER TABLE [dbo].[users] ADD CONSTRAINT DF_users_created_at DEFAULT(getdate()) FOR [created_at]
GO



-- PasswordResetTokens: garantir FK
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_PasswordResetTokens_users')
	ALTER TABLE [dbo].[PasswordResetTokens] ADD CONSTRAINT FK_PasswordResetTokens_users FOREIGN KEY([user_id]) REFERENCES [dbo].[users]([id])
GO

-- ALERTAS_ESTOQUE: garantir FK
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_ALERTAS_ESTOQUE_PRODUTO')
	ALTER TABLE [dbo].[ALERTAS_ESTOQUE] ADD CONSTRAINT FK_ALERTAS_ESTOQUE_PRODUTO FOREIGN KEY([CODIGO_PRODUTO]) REFERENCES [dbo].[PRODUTO]([CODIGO])
GO

-- Fim do patch
