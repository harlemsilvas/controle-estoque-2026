IF OBJECT_ID('dbo.AccessProfiles','U') IS NULL OR OBJECT_ID('dbo.AccessProfileAudit','U') IS NULL THROW 50000, 'Estrutura de perfis ausente', 1;
IF (SELECT COUNT(*) FROM dbo.AccessProfiles WHERE code IN ('admin','user','readonly')) <> 3 THROW 50000, 'Perfis base ausentes', 1;
SELECT code,name,version FROM dbo.AccessProfiles ORDER BY code;
