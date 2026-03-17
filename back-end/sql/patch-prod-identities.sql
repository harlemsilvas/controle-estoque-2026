-- PATCH DE ATUALIZAÇÃO PARA PRODUÇÃO
-- Ajusta colunas CODIGO para IDENTITY nas tabelas de histórico/cadastro
-- e garante criação/ajuste de tabelas auxiliares.
--
-- Banco-alvo: HRM

USE HRM;
GO

/* ------------------------------------------------------------------
   1) ESTOQUE_PRODUTO: transformar CODIGO em IDENTITY preservando histórico
   ------------------------------------------------------------------ */
BEGIN TRY
    BEGIN TRAN;

    IF OBJECT_ID('dbo.ESTOQUE_PRODUTO', 'U') IS NOT NULL
       AND COLUMNPROPERTY(OBJECT_ID('dbo.ESTOQUE_PRODUTO'), 'CODIGO', 'IsIdentity') = 0
    BEGIN
        PRINT 'Ajustando ESTOQUE_PRODUTO para usar CODIGO como IDENTITY...';

        EXEC sp_rename 'dbo.ESTOQUE_PRODUTO', 'ESTOQUE_PRODUTO_OLD';

        CREATE TABLE [dbo].[ESTOQUE_PRODUTO](
            [CODIGO]         [int] IDENTITY(1,1) NOT NULL,
            [CODIGO_PRODUTO] [int] NOT NULL,
            [TIPO_LANCAMENTO] [char](1) NOT NULL,
            [QUANTIDADE]     [int] NOT NULL,
            [DATA]           [datetime] NULL,
            [TAG]            [varchar](10) NULL,
            [USUARIO]        [varchar](10) NULL,
            CONSTRAINT [PK_ESTOQUE_PRODUTO_CODIGO] PRIMARY KEY CLUSTERED ([CODIGO] ASC)
        ) ON [PRIMARY];

        SET IDENTITY_INSERT [dbo].[ESTOQUE_PRODUTO] ON;

        INSERT INTO [dbo].[ESTOQUE_PRODUTO] (
            CODIGO, CODIGO_PRODUTO, TIPO_LANCAMENTO, QUANTIDADE, DATA, TAG, USUARIO
        )
        SELECT
            CODIGO, CODIGO_PRODUTO, TIPO_LANCAMENTO, QUANTIDADE, DATA, TAG, USUARIO
        FROM [dbo].[ESTOQUE_PRODUTO_OLD];

        SET IDENTITY_INSERT [dbo].[ESTOQUE_PRODUTO] OFF;

        IF NOT EXISTS (
            SELECT * FROM sys.default_constraints
            WHERE name = 'DF_ESTOQUE_PRODUTO_USUARIO_NEW'
        )
            ALTER TABLE [dbo].[ESTOQUE_PRODUTO]
              ADD CONSTRAINT DF_ESTOQUE_PRODUTO_USUARIO_NEW DEFAULT('HRM') FOR [USUARIO];

        DECLARE @maxCodigoEstoque int = (SELECT ISNULL(MAX(CODIGO), 0) FROM [dbo].[ESTOQUE_PRODUTO]);
        DBCC CHECKIDENT ('ESTOQUE_PRODUTO', RESEED, @maxCodigoEstoque);

        PRINT 'ESTOQUE_PRODUTO ajustada com sucesso.';
    END
    ELSE
    BEGIN
        PRINT 'ESTOQUE_PRODUTO ja esta com CODIGO como IDENTITY ou nao existe. Nenhuma alteracao.';
    END

    COMMIT TRAN;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    PRINT 'ERRO ao ajustar ESTOQUE_PRODUTO: Linha=' + CAST(ERROR_LINE() AS varchar(10))
        + ' Numero=' + CAST(ERROR_NUMBER() AS varchar(10))
        + ' Msg=' + ERROR_MESSAGE();

    THROW;
END CATCH;
GO

/* ------------------------------------------------------------------
   2) FORNECEDOR: CODIGO como IDENTITY e CNPJ com tamanho adequado
   ------------------------------------------------------------------ */
BEGIN TRY
    BEGIN TRAN;

    IF OBJECT_ID('dbo.FORNECEDOR', 'U') IS NOT NULL
       AND COLUMNPROPERTY(OBJECT_ID('dbo.FORNECEDOR'), 'CODIGO', 'IsIdentity') = 0
    BEGIN
        PRINT 'Ajustando FORNECEDOR para usar CODIGO como IDENTITY e CNPJ >= 18...';

        -- Remover FK de PRODUTO -> FORNECEDOR, se existir
        IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_PRODUTO_FORNECEDOR')
            ALTER TABLE [dbo].[PRODUTO] DROP CONSTRAINT FK_PRODUTO_FORNECEDOR;

        EXEC sp_rename 'dbo.FORNECEDOR', 'FORNECEDOR_OLD';

        CREATE TABLE [dbo].[FORNECEDOR](
            [CODIGO]   [int] IDENTITY(1,1) NOT NULL,
            [NOME]     [varchar](100) NOT NULL,
            [CNPJ]     [varchar](18) NULL,
            [TELEFONE] [varchar](20) NULL,
            [EMAIL]    [varchar](100) NULL,
            [ENDERECO] [varchar](200) NULL,
            CONSTRAINT [PK_FORNECEDOR_CODIGO] PRIMARY KEY CLUSTERED ([CODIGO] ASC),
            CONSTRAINT [UQ_FORNECEDOR_CNPJ] UNIQUE NONCLUSTERED ([CNPJ] ASC)
        ) ON [PRIMARY];

        SET IDENTITY_INSERT [dbo].[FORNECEDOR] ON;

        INSERT INTO [dbo].[FORNECEDOR] (
            CODIGO, NOME, CNPJ, TELEFONE, EMAIL, ENDERECO
        )
        SELECT
            CODIGO, NOME,
            CNPJ, TELEFONE, EMAIL, ENDERECO
        FROM [dbo].[FORNECEDOR_OLD];

        SET IDENTITY_INSERT [dbo].[FORNECEDOR] OFF;

        DECLARE @maxFornecedorCodigo int =
            (SELECT ISNULL(MAX(CODIGO), 0) FROM [dbo].[FORNECEDOR]);
        DBCC CHECKIDENT ('FORNECEDOR', RESEED, @maxFornecedorCodigo);

        -- Recriar a FK de PRODUTO -> FORNECEDOR
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PRODUTO') AND name = 'COD_FORNECEDOR')
        BEGIN
            ALTER TABLE [dbo].[PRODUTO]  WITH CHECK
              ADD CONSTRAINT FK_PRODUTO_FORNECEDOR
              FOREIGN KEY([COD_FORNECEDOR]) REFERENCES [dbo].[FORNECEDOR]([CODIGO]);
        END

        PRINT 'FORNECEDOR ajustada com sucesso.';
    END
    ELSE
    BEGIN
        PRINT 'FORNECEDOR ja esta com CODIGO como IDENTITY ou nao existe. Nenhuma alteracao.';
    END

    COMMIT TRAN;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    PRINT 'ERRO ao ajustar FORNECEDOR:'
        + ' Linha=' + CAST(ERROR_LINE() AS varchar(10))
        + ' Numero=' + CAST(ERROR_NUMBER() AS varchar(10))
        + ' Msg=' + ERROR_MESSAGE();

    THROW;  -- repropaga o erro
END CATCH;
GO

/* ------------------------------------------------------------------
   3) MARCA_PRODUTO: CODIGO como IDENTITY e DESCRICAO(255)
   ------------------------------------------------------------------ */
BEGIN TRY
    BEGIN TRAN;

    IF OBJECT_ID('dbo.MARCA_PRODUTO', 'U') IS NOT NULL
       AND COLUMNPROPERTY(OBJECT_ID('dbo.MARCA_PRODUTO'), 'CODIGO', 'IsIdentity') = 0
    BEGIN
        PRINT 'Ajustando MARCA_PRODUTO para usar CODIGO como IDENTITY e DESCRICAO(255)...';

        -- Remover FK de PRODUTO -> MARCA_PRODUTO, se existir
        IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_PRODUTO_MARCA')
            ALTER TABLE [dbo].[PRODUTO] DROP CONSTRAINT FK_PRODUTO_MARCA;

        EXEC sp_rename 'dbo.MARCA_PRODUTO', 'MARCA_PRODUTO_OLD';

        CREATE TABLE [dbo].[MARCA_PRODUTO](
            [CODIGO]    [int] IDENTITY(1,1) NOT NULL,
            [DESCRICAO] [varchar](255) NOT NULL,
            CONSTRAINT [PK_MARCA_PRODUTO_CODIGO] PRIMARY KEY CLUSTERED ([CODIGO] ASC)
        ) ON [PRIMARY];

        SET IDENTITY_INSERT [dbo].[MARCA_PRODUTO] ON;

        INSERT INTO [dbo].[MARCA_PRODUTO] (CODIGO, DESCRICAO)
        SELECT CODIGO, DESCRICAO
        FROM [dbo].[MARCA_PRODUTO_OLD];

        SET IDENTITY_INSERT [dbo].[MARCA_PRODUTO] OFF;

        DECLARE @maxMarcaCodigo int = (SELECT ISNULL(MAX(CODIGO), 0) FROM [dbo].[MARCA_PRODUTO]);
        DBCC CHECKIDENT ('MARCA_PRODUTO', RESEED, @maxMarcaCodigo);

        -- Recriar FK de PRODUTO -> MARCA_PRODUTO
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PRODUTO') AND name = 'CODIGO_MARCA')
        BEGIN
            ALTER TABLE [dbo].[PRODUTO]  WITH CHECK
              ADD CONSTRAINT FK_PRODUTO_MARCA
              FOREIGN KEY([CODIGO_MARCA]) REFERENCES [dbo].[MARCA_PRODUTO]([CODIGO]);
        END

        PRINT 'MARCA_PRODUTO ajustada com sucesso.';
    END
    ELSE
    BEGIN
        PRINT 'MARCA_PRODUTO ja esta com CODIGO como IDENTITY ou nao existe. Nenhuma alteracao.';
    END

    COMMIT TRAN;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    PRINT 'ERRO ao ajustar MARCA_PRODUTO: Linha=' + CAST(ERROR_LINE() AS varchar(10))
        + ' Numero=' + CAST(ERROR_NUMBER() AS varchar(10))
        + ' Msg=' + ERROR_MESSAGE();

    THROW;
END CATCH;
GO

/* ------------------------------------------------------------------
   4) FAMILIA_PRODUTO: CODIGO como IDENTITY, preservando dados
      e recriando FK com PRODUTO, se existir
   ------------------------------------------------------------------ */
BEGIN TRY
    BEGIN TRAN;

    IF OBJECT_ID('dbo.FAMILIA_PRODUTO', 'U') IS NOT NULL
       AND COLUMNPROPERTY(OBJECT_ID('dbo.FAMILIA_PRODUTO'), 'CODIGO', 'IsIdentity') = 0
    BEGIN
        PRINT 'Ajustando FAMILIA_PRODUTO para usar CODIGO como IDENTITY e DESCRICAO(255)...';

        -- Remover FK de PRODUTO -> FAMILIA_PRODUTO, se existir
        IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_PRODUTO_FAMILIA')
            ALTER TABLE [dbo].[PRODUTO] DROP CONSTRAINT FK_PRODUTO_FAMILIA;

        EXEC sp_rename 'dbo.FAMILIA_PRODUTO', 'FAMILIA_PRODUTO_OLD';

        SET ANSI_NULLS ON;
        SET QUOTED_IDENTIFIER ON;

        CREATE TABLE [dbo].[FAMILIA_PRODUTO](
            [CODIGO]    [int] IDENTITY(1,1) NOT NULL,
            [DESCRICAO] [varchar](255) NOT NULL,
            CONSTRAINT [PK_FAMILIA_PRODUTO_CODIGO] PRIMARY KEY CLUSTERED ([CODIGO] ASC)
        ) ON [PRIMARY];

        SET IDENTITY_INSERT [dbo].[FAMILIA_PRODUTO] ON;

        INSERT INTO [dbo].[FAMILIA_PRODUTO] (CODIGO, DESCRICAO)
        SELECT CODIGO, DESCRICAO
        FROM [dbo].[FAMILIA_PRODUTO_OLD];

        SET IDENTITY_INSERT [dbo].[FAMILIA_PRODUTO] OFF;

        DECLARE @maxFamiliaCodigo int = (SELECT ISNULL(MAX(CODIGO), 0) FROM [dbo].[FAMILIA_PRODUTO]);
        DBCC CHECKIDENT ('FAMILIA_PRODUTO', RESEED, @maxFamiliaCodigo);

        -- Recriar FK de PRODUTO -> FAMILIA_PRODUTO, se coluna existir
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PRODUTO') AND name = 'CODIGO_FAMILIA')
        BEGIN
            ALTER TABLE [dbo].[PRODUTO]  WITH CHECK
              ADD CONSTRAINT FK_PRODUTO_FAMILIA
              FOREIGN KEY([CODIGO_FAMILIA]) REFERENCES [dbo].[FAMILIA_PRODUTO]([CODIGO]);
        END

        PRINT 'FAMILIA_PRODUTO ajustada com sucesso.';
    END
    ELSE IF OBJECT_ID('dbo.FAMILIA_PRODUTO', 'U') IS NULL
    BEGIN
        PRINT 'Criando tabela FAMILIA_PRODUTO...';

        SET ANSI_NULLS ON;
        SET QUOTED_IDENTIFIER ON;

        CREATE TABLE [dbo].[FAMILIA_PRODUTO](
            [CODIGO]    [int] IDENTITY(1,1) NOT NULL,
            [DESCRICAO] [varchar](255) NOT NULL,
            CONSTRAINT [PK_FAMILIA_PRODUTO_CODIGO] PRIMARY KEY CLUSTERED ([CODIGO] ASC)
        ) ON [PRIMARY];

        PRINT 'FAMILIA_PRODUTO criada com sucesso.';
    END
    ELSE
    BEGIN
        PRINT 'FAMILIA_PRODUTO ja esta com CODIGO como IDENTITY. Nenhuma alteracao.';
    END

    COMMIT TRAN;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    PRINT 'ERRO ao ajustar FAMILIA_PRODUTO: Linha=' + CAST(ERROR_LINE() AS varchar(10))
        + ' Numero=' + CAST(ERROR_NUMBER() AS varchar(10))
        + ' Msg=' + ERROR_MESSAGE();

    THROW;
END CATCH;
GO

-- Fim do patch de identidades para producao
/* ------------------------------------------------------------------
     4) PRODUTO: transformar CODIGO em IDENTITY preservando dados e FKs 
     ------------------------------------------------------------------ */

USE HRM;
GO

BEGIN TRY
        BEGIN TRAN;

        /* 1) Remover FK de ALERTAS_ESTOQUE -> PRODUTO, se existir */
        IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_ALERTAS_ESTOQUE_PRODUTO')
            ALTER TABLE [dbo].[ALERTAS_ESTOQUE] DROP CONSTRAINT FK_ALERTAS_ESTOQUE_PRODUTO;

        /* 2) Renomear tabela PRODUTO atual para backup */
        EXEC sp_rename 'dbo.PRODUTO', 'PRODUTO_OLD';

        /* 3) Criar nova PRODUTO com CODIGO como IDENTITY e mesmos campos */
        CREATE TABLE [dbo].[PRODUTO](
            [CODIGO]         [int] IDENTITY(1,1) NOT NULL,
            [CODIGO_INTERNO] [varchar](15) NULL,
            [DESCRICAO]      [varchar](80) NOT NULL,
            [CODIGO_BARRAS]  [varchar](13) NULL,
            [ESTOQUE_MINIMO] [int] NOT NULL,
            [ESTOQUE_ATUAL]  [int] NOT NULL,
            [CODIGO_MARCA]   [int] NULL,
            [CODIGO_FAMILIA] [int] NULL,
            [DELETADO_EM]    [datetime] NULL,
            [VALOR_UNITARIO] [decimal](10, 2) NOT NULL,
            [COD_FORNECEDOR] [int] NULL,
            [DELETADO]       [bit] NOT NULL,
            CONSTRAINT [PK_PRODUTO_CODIGO_NEW] PRIMARY KEY CLUSTERED ([CODIGO] ASC)
        ) ON [PRIMARY];

        /* 4) Copiar todos os registros preservando CODIGO */
        SET IDENTITY_INSERT [dbo].[PRODUTO] ON;

        INSERT INTO [dbo].[PRODUTO] (
            CODIGO, CODIGO_INTERNO, DESCRICAO, CODIGO_BARRAS,
            ESTOQUE_MINIMO, ESTOQUE_ATUAL,
            CODIGO_MARCA, CODIGO_FAMILIA,
            DELETADO_EM, VALOR_UNITARIO,
            COD_FORNECEDOR, DELETADO
        )
        SELECT
            CODIGO, CODIGO_INTERNO, DESCRICAO, CODIGO_BARRAS,
            ESTOQUE_MINIMO, ESTOQUE_ATUAL,
            CODIGO_MARCA, CODIGO_FAMILIA,
            DELETADO_EM, VALOR_UNITARIO,
            COD_FORNECEDOR, DELETADO
        FROM [dbo].[PRODUTO_OLD];

        SET IDENTITY_INSERT [dbo].[PRODUTO] OFF;

        /* 5) Ajustar o seed do IDENTITY */
        DECLARE @maxProdCodigo int = (SELECT ISNULL(MAX(CODIGO), 0) FROM [dbo].[PRODUTO]);
        DBCC CHECKIDENT ('PRODUTO', RESEED, @maxProdCodigo);

        /* 6) Recriar defaults na nova tabela (nomes novos para evitar conflito) */
        IF NOT EXISTS (
            SELECT * FROM sys.default_constraints
            WHERE parent_object_id = OBJECT_ID('dbo.PRODUTO')
                AND name = 'DF_PRODUTO_CODIGO_MARCA_NEW'
        )
            ALTER TABLE [dbo].[PRODUTO]
                ADD CONSTRAINT DF_PRODUTO_CODIGO_MARCA_NEW DEFAULT((1)) FOR [CODIGO_MARCA];

        IF NOT EXISTS (
            SELECT * FROM sys.default_constraints
            WHERE parent_object_id = OBJECT_ID('dbo.PRODUTO')
                AND name = 'DF_PRODUTO_DELETADO_NEW'
        )
            ALTER TABLE [dbo].[PRODUTO]
                ADD CONSTRAINT DF_PRODUTO_DELETADO_NEW DEFAULT((0)) FOR [DELETADO];

        /* 7) Recriar FKs com nomes novos, se as colunas existirem */
        IF EXISTS (
            SELECT * FROM sys.columns
            WHERE object_id = OBJECT_ID('dbo.PRODUTO') AND name = 'CODIGO_FAMILIA'
        )
        BEGIN
            ALTER TABLE [dbo].[PRODUTO]  WITH CHECK
                ADD CONSTRAINT FK_PRODUTO_FAMILIA_NEW
                FOREIGN KEY([CODIGO_FAMILIA]) REFERENCES [dbo].[FAMILIA_PRODUTO]([CODIGO]);
        END

        IF EXISTS (
            SELECT * FROM sys.columns
            WHERE object_id = OBJECT_ID('dbo.PRODUTO') AND name = 'COD_FORNECEDOR'
        )
        BEGIN
            ALTER TABLE [dbo].[PRODUTO]  WITH CHECK
                ADD CONSTRAINT FK_PRODUTO_FORNECEDOR_NEW
                FOREIGN KEY([COD_FORNECEDOR]) REFERENCES [dbo].[FORNECEDOR]([CODIGO]);
        END

        IF OBJECT_ID('dbo.ALERTAS_ESTOQUE', 'U') IS NOT NULL
        BEGIN
            ALTER TABLE [dbo].[ALERTAS_ESTOQUE]  WITH CHECK
                ADD CONSTRAINT FK_ALERTAS_ESTOQUE_PRODUTO_NEW
                FOREIGN KEY([CODIGO_PRODUTO]) REFERENCES [dbo].[PRODUTO]([CODIGO]);
        END

        COMMIT TRAN;
END TRY
BEGIN CATCH
        IF @@TRANCOUNT > 0
                ROLLBACK TRAN;

        PRINT 'ERRO ao ajustar PRODUTO: Linha=' + CAST(ERROR_LINE() AS varchar(10))
                + ' Numero=' + CAST(ERROR_NUMBER() AS varchar(10))
                + ' Msg=' + ERROR_MESSAGE();

        THROW;
END CATCH;
GO

-- (Opcional, depois de conferir tudo)
-- DROP TABLE [dbo].[PRODUTO_OLD];
