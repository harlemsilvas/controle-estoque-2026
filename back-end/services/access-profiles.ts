import sql from 'mssql';
import { connectToDatabase } from '../models/db';
export const permissionGroups = [{"code": "products", "label": "Produtos", "actions": ["read", "create", "edit", "delete"]}, {"code": "brands", "label": "Marcas", "actions": ["read", "create", "edit", "delete"]}, {"code": "families", "label": "Famílias", "actions": ["read", "create", "edit", "delete"]}, {"code": "suppliers", "label": "Fornecedores", "actions": ["read", "create", "edit", "delete"]}, {"code": "reports", "label": "Relatórios", "actions": ["read"]}, {"code": "stock", "label": "Estoque", "actions": ["read", "move"]}, {"code": "alerts", "label": "Alertas", "actions": ["read", "edit"]}, {"code": "trash", "label": "Lixeira", "actions": ["read", "restore", "delete"]}, {"code": "users", "label": "Usuários", "actions": ["read", "create", "edit"]}, {"code": "profiles", "label": "Perfis", "actions": ["read", "create", "edit"]}, {"code": "settings", "label": "Configurações", "actions": ["read", "edit"]}];
export const allPermissions = permissionGroups.flatMap(g => g.actions.map(a => `${g.code}.${a}`));
export async function profilePermissions(code: string): Promise<{ permissions: string[]; name: string }> {
  if (code === 'admin') return { permissions: allPermissions, name: 'Administrador' };
  const pool = await connectToDatabase();
  const result = await pool.request().input('code', sql.VarChar(20), code)
    .query('SELECT name,permissions FROM dbo.AccessProfiles WHERE code=@code');
  const row = result.recordset[0];
  return { permissions: row ? JSON.parse(row.permissions) : [], name: row?.name || code };
}
export async function listProfiles() {
  const pool = await connectToDatabase();
  const result = await pool.request().query('SELECT code,name,description,permissions,version FROM dbo.AccessProfiles ORDER BY name');
  return result.recordset.map(p => ({ ...p, permissions: p.code === 'admin' ? allPermissions : JSON.parse(p.permissions) }));
}
export function validateProfile(data: any) {
  if (!data || !/^[a-z][a-z0-9_-]{0,19}$/.test(data.code || '') || typeof data.name !== 'string'
    || !data.name.trim() || data.name.trim().length > 80 || typeof (data.description ?? '') !== 'string'
    || (data.description || '').length > 300 || !Array.isArray(data.permissions)
    || data.permissions.some((p: unknown) => typeof p !== 'string' || !allPermissions.includes(p)))
    throw Object.assign(new Error('Código, nome ou permissões inválidos.'), { status: 400 });
  const permissions: string[] = [...new Set<string>(data.permissions)];
  for (const p of [...permissions]) {
    const read = p.split('.')[0] + '.read';
    if (!permissions.includes(read)) permissions.push(read);
  }
  return { code: data.code, name: data.name.trim(), description: data.description || '', permissions };
}
export async function saveProfile(data: any, actor: number, create: boolean) {
  const p = validateProfile(data);
  if (p.code === 'admin') throw Object.assign(new Error('O perfil Administrador é protegido e mantém acesso completo.'), { status: 403 });
  const pool = await connectToDatabase(), tx = new sql.Transaction(pool);
  await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const before = await new sql.Request(tx).input('code', sql.VarChar(20), p.code)
      .query('SELECT code,name,description,permissions,version FROM dbo.AccessProfiles WITH (UPDLOCK,HOLDLOCK) WHERE code=@code');
    const old = before.recordset[0];
    if ((create && old) || (!create && (!old || old.version !== data.version)))
      throw Object.assign(new Error(create ? 'Código de perfil já cadastrado.' : 'Perfil mudou ou não existe. Recarregue antes de salvar.'), { status: 409 });
    await new sql.Request(tx).input('code', sql.VarChar(20), p.code).input('name', sql.NVarChar(80), p.name)
      .input('description', sql.NVarChar(300), p.description).input('permissions', sql.NVarChar(sql.MAX), JSON.stringify(p.permissions))
      .query(create ? 'INSERT INTO dbo.AccessProfiles(code,name,description,permissions) VALUES(@code,@name,@description,@permissions)'
        : 'UPDATE dbo.AccessProfiles SET name=@name,description=@description,permissions=@permissions,version=version+1,updated_at=SYSUTCDATETIME() WHERE code=@code');
    await new sql.Request(tx).input('code', sql.VarChar(20), p.code).input('actor', sql.Int, actor)
      .input('action', sql.VarChar(20), create ? 'create' : 'edit').input('before', sql.NVarChar(sql.MAX), old ? JSON.stringify(old) : null)
      .input('after', sql.NVarChar(sql.MAX), JSON.stringify(p)).query('INSERT INTO dbo.AccessProfileAudit(profile_code,actor_id,action,before_json,after_json) VALUES(@code,@actor,@action,@before,@after)');
    await tx.commit();return p;
  } catch (error) { await tx.rollback();throw error; }
}
