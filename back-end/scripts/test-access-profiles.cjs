const root=require('path').resolve(__dirname,'..');
require(root+'/node_modules/dotenv').config({path:root+'/.env'});
const assert=require('assert/strict'),sql=require(root+'/node_modules/mssql');
(async()=>{
 const pool=await require(root+'/dist/models/db').connectToDatabase();
 const service=require(root+'/dist/services/access-profiles'),policy=require(root+'/dist/middleware/access-policy');
 const Original=sql.Request, originalRequest=pool.request.bind(pool);
 const profiles='##access_profiles_'+process.pid,audit='##access_audit_'+process.pid;
 const q=new Original(pool);
 await q.query(`CREATE TABLE ${profiles}(code varchar(20) PRIMARY KEY,name nvarchar(80),description nvarchar(300),permissions nvarchar(max),version int DEFAULT 1,updated_at datetime2 DEFAULT SYSUTCDATETIME()); CREATE TABLE ${audit}(profile_code varchar(20),actor_id int,action varchar(20),before_json nvarchar(max),after_json nvarchar(max));`);
 sql.Request=function(...args){const req=new Original(...args),query=req.query.bind(req);req.query=text=>query(text.replaceAll('dbo.AccessProfiles',profiles).replaceAll('dbo.AccessProfileAudit',audit));return req;};
 pool.request=()=>new sql.Request(pool);
 try {
  const data={code:'teste_leitura',name:'Teste Leitura',permissions:['products.read'],description:''};
  await service.saveProfile(data,123,true);
  assert.deepEqual((await service.profilePermissions(data.code)).permissions,['products.read']);
  await assert.rejects(service.saveProfile(data,123,true),e=>e.status===409);
  await service.saveProfile({...data,permissions:['products.edit'],version:1},123,false);
  assert.deepEqual((await service.profilePermissions(data.code)).permissions,['products.edit','products.read']);
  await assert.rejects(service.saveProfile({...data,version:1},123,false),e=>e.status===409);
  await assert.rejects(service.saveProfile({...data,code:'admin'},123,false),e=>e.status===403);
  assert.throws(()=>service.validateProfile({...data,permissions:['invalid.edit']}),e=>e.status===400);
  assert.equal((await new Original(pool).query(`SELECT COUNT(*) count FROM ${audit}`)).recordset[0].count,2);
  assert.equal(policy.requiredPermission({method:'POST',path:'/produto/1/excluir-tudo'}),'products.delete');
  assert.equal(policy.requiredPermission({method:'POST',path:'/produtos/restaurar/1'}),'trash.restore');
  assert.equal(policy.requiredPermission({method:'PATCH',path:'/produto/1/fornecedor'}),'products.edit');
  console.log('PASS: criação/edição de perfis, auditoria, concorrência, códigos inválidos, admin protegido e políticas de exclusão/restauração. Apenas tabelas temporárias alteradas.');
 }finally{sql.Request=Original;pool.request=originalRequest;await new Original(pool).query(`DROP TABLE ${profiles}; DROP TABLE ${audit};`);await pool.close();}
})().catch(e=>{console.error(e.name,e.message);process.exitCode=1});
