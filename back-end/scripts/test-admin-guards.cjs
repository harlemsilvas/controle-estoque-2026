const root=require('path').resolve(__dirname,'..');require(root+'/node_modules/dotenv').config({path:root+'/.env'});
const assert=require('assert/strict'),sql=require(root+'/node_modules/mssql');
(async()=>{
 let rows=[{id:1,role:'admin',is_active:true},{id:2,role:'user',is_active:true}],writes=0;
 class Tx {async begin(){this.snapshot=structuredClone(rows);}async commit(){}async rollback(){rows=this.snapshot;}}
 class Request {constructor(){this.params={};}input(key,_type,value){this.params[key]=value;return this;}async query(text){if(text.startsWith('SELECT'))return {recordset:structuredClone(rows)};
  const row=rows.find(r=>r.id===this.params.id);if(text.includes('SET role'))row.role=this.params.role;else row.is_active=!!this.params.is_active;writes++;return {rowsAffected:[1]};}}
 sql.Transaction=Tx;sql.Request=Request;const db=require(root+'/dist/models/db');db.connectToDatabase=async()=>({});
 const users=require(root+'/dist/services/usuarioService');
 await assert.rejects(users.atualizarStatusUsuario(1,false),e=>e.status===409);
 await assert.rejects(users.atualizarRoleUsuario(1,'user'),e=>e.status===409);assert.equal(writes,0);
 await assert.rejects(users.atualizarStatusUsuario(99,false),e=>e.status===404);
 await users.atualizarRoleUsuario(2,'admin');await users.atualizarStatusUsuario(1,false);assert.equal(writes,2);
 await assert.rejects(users.atualizarStatusUsuario(2,false),e=>e.status===409);await assert.rejects(users.atualizarRoleUsuario(2,'user'),e=>e.status===409);
 assert.equal(rows.filter(r=>r.role==='admin'&&r.is_active).length,1);
 console.log('PASS: último administrador ativo não pode ser desativado/rebaixado; segundo administrador permite manutenção. Banco simulado.');
})().catch(e=>{console.error(e.name,e.message);process.exitCode=1;});
