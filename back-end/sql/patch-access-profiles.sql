SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF OBJECT_ID('dbo.AccessProfiles', 'U') IS NULL
CREATE TABLE dbo.AccessProfiles (
 code varchar(20) NOT NULL PRIMARY KEY,
 name nvarchar(80) NOT NULL,
 description nvarchar(300) NOT NULL DEFAULT '',
 permissions nvarchar(max) NOT NULL,
 version int NOT NULL DEFAULT 1,
 updated_at datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
);
IF OBJECT_ID('dbo.AccessProfileAudit', 'U') IS NULL
CREATE TABLE dbo.AccessProfileAudit (
 id bigint IDENTITY PRIMARY KEY, profile_code varchar(20) NOT NULL,
 actor_id int NOT NULL, action varchar(20) NOT NULL,
 before_json nvarchar(max) NULL, after_json nvarchar(max) NOT NULL,
 created_at datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
);
IF NOT EXISTS (SELECT 1 FROM dbo.AccessProfiles WHERE code='admin')
 INSERT INTO dbo.AccessProfiles(code,name,permissions) VALUES('admin',N'Administrador',N'["products.read", "products.create", "products.edit", "products.delete", "brands.read", "brands.create", "brands.edit", "brands.delete", "families.read", "families.create", "families.edit", "families.delete", "suppliers.read", "suppliers.create", "suppliers.edit", "suppliers.delete", "reports.read", "stock.read", "stock.move", "alerts.read", "alerts.edit", "trash.read", "trash.restore", "trash.delete", "users.read", "users.create", "users.edit", "profiles.read", "profiles.create", "profiles.edit", "settings.read", "settings.edit"]');
IF NOT EXISTS (SELECT 1 FROM dbo.AccessProfiles WHERE code='user')
 INSERT INTO dbo.AccessProfiles(code,name,permissions) VALUES('user',N'Usuário',N'["products.read", "brands.read", "families.read", "suppliers.read", "reports.read", "stock.read", "alerts.read", "trash.read", "stock.move"]');
IF NOT EXISTS (SELECT 1 FROM dbo.AccessProfiles WHERE code='readonly')
 INSERT INTO dbo.AccessProfiles(code,name,permissions) VALUES('readonly',N'Somente leitura',N'["products.read", "brands.read", "families.read", "suppliers.read", "reports.read", "stock.read", "alerts.read", "trash.read"]');
COMMIT TRANSACTION;
