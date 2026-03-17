-- Adiciona o campo DELETADO à tabela PRODUTO para controle de lixeira
ALTER TABLE PRODUTO ADD DELETADO BIT NOT NULL DEFAULT 0;
-- Atualiza todos os produtos existentes para não deletados (opcional, pois default já cobre)
UPDATE PRODUTO SET DELETADO = 0 WHERE DELETADO IS NULL;
