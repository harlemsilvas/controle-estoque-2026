const path=require('path').resolve(__dirname,'..');
require(path+'/node_modules/dotenv').config({path:path+'/.env'});
const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict');
process.env.PASSWORD_RECOVERY_ENABLED='false';
const file=require('path').join(require('os').tmpdir(),'estoque-revocations-'+process.pid+'.json');process.env.SESSION_REVOCATION_FILE=file;
const jwt=require(path+'/node_modules/jsonwebtoken'),bcrypt=require(path+'/node_modules/bcryptjs');
(async()=>{
 const users=require(path+'/dist/services/usuarioService');
 const originals={byId:users.buscarUsuarioPorId,byEmail:users.buscarUsuarioPorEmail};
 const password=crypto.randomBytes(20).toString('hex');
 let current={id:123,username:'auth-test',email:'teste@example.invalid',role:'user',is_active:true,password_hash:await bcrypt.hash(password,4)};
 users.buscarUsuarioPorId=async id=>id===123?current:null;
 users.buscarUsuarioPorEmail=async email=>email===current.email?current:null;
 // Fixtures independentes dos perfis editaveis do banco; nenhuma escrita real permitida.
 const access=require(path+'/dist/services/access-profiles');
 const profileOriginal=access.profilePermissions, saveOriginal=access.saveProfile;
 const reads=access.allPermissions.filter(p=>p.endsWith('.read')&&!/^(users|profiles|settings)\./.test(p));
 access.profilePermissions=async role=>({name:role==='readonly'?'Somente leitura':role==='admin'?'Administrador':'Usuário',permissions:role==='admin'?access.allPermissions:role==='user'?[...reads,'stock.move']:reads});
 access.saveProfile=async()=>{throw Object.assign(new Error('Escrita real bloqueada no teste.'),{status:418});};
 const controllerOriginals=[];
 for(const name of ['produto','marca','familia','fornecedor','usuario','estoque','alerta']) {
   const mod=require(path+'/dist/controllers/'+name+'Controller');
   const controller=mod.default || mod;
   for(const key of Object.keys(controller)) if(/criar|atualiz|remov|exclu|restaur|associ|moviment|resolver|alterar/i.test(key)&&typeof controller[key]==='function') {
     controllerOriginals.push([controller,key,controller[key]]);
     controller[key]=(_req,res)=>res.status(418).json({error:'Escrita real bloqueada no teste.'});
   }
 }
 const security=require(path+'/dist/middleware/session-security');
 await require(path+'/dist/models/db').connectToDatabase();
 const app=require(path+'/dist/app').default;
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
 let count=0;
 async function call(url,{token,method='GET',body}={}) {
  const headers={};if(token)headers.Authorization='Bearer '+token;if(body)headers['Content-Type']='application/json';
  const response=await fetch(base+url,{method,headers,body:body?JSON.stringify(body):undefined});const text=await response.text();let data;try{data=JSON.parse(text)}catch{data=text}
  count++;return {status:response.status,data};
 }
 const token=(extras={})=>jwt.sign({id:123,passwordStamp:security.passwordStamp(current.password_hash),...extras},security.jwtSecret(),{algorithm:'HS256',expiresIn:'10m',jwtid:crypto.randomUUID()});
 try{
  assert.equal((await call('/health')).status,200);
  for(const route of ['/produto','/fornecedor','/marca','/familia','/usuarios','/relatorio/movimentacoes','/produto-aggregate','/api-docs','/me'])assert.equal((await call(route)).status,401);
  assert.equal((await call('/forcar-senha',{method:'POST',body:{}})).status,410);
  for(const route of ['/recuperar-senha','/reset-password'])assert.equal((await call(route,{method:'POST',body:{}})).status,400);
  assert.equal((await call('/me',{token:'invalid'})).status,401);
  const expired=jwt.sign({id:123},security.jwtSecret(),{expiresIn:-10});assert.equal((await call('/me',{token:expired})).status,401);
  assert.equal((await call('/me',{token:jwt.sign({id:123},security.jwtSecret())})).status,401);
  let login=await call('/login',{method:'POST',body:{email:current.email,password}});assert.equal(login.status,200);let live=login.data.token;
  assert.equal((await call('/me',{token:live})).status,200);
  assert.equal((await call('/usuarios',{token:live})).status,403);
  for(const route of ['/produto','/fornecedor','/marca','/familia','/produto/1/fornecedor','/produtos/lixeira/1'])assert.equal((await call(route,{token:live,method:route.includes('fornecedor')&&route.startsWith('/produto/')?'PATCH':'POST',body:{}})).status,403);
  for(const route of ['/produto?limit=1','/fornecedor?limit=1','/marca?limit=1','/familia?limit=1','/produto-aggregate','/relatorio/movimentacoes?limit=1','/relatorio/movimentacoes?dataInicio=2026-10-05&dataFim=2026-10-05&format=csv'])assert.equal((await call(route,{token:live})).status,200);
  for(const resource of ['produtos','fornecedores','marcas','familias']) {
    const report=await call('/relatorio/cadastros/'+resource+'?limit=1',{token:live});assert.equal(report.status,200,resource);assert(Array.isArray(report.data.data));assert(Array.isArray(report.data.columns));assert(report.data.data.length<=1);
    assert.equal((await call('/relatorio/cadastros/'+resource+'?format=csv',{token:live})).status,200,resource+' CSV');
  }
  const accessFunction=access.profilePermissions;
  access.profilePermissions=async()=>({name:'Restrito',permissions:['reports.read']});
  assert.equal((await call('/relatorio/cadastros/produtos',{token:live})).status,403);
  access.profilePermissions=accessFunction;
  assert.equal((await call('/relatorio/cadastros/produtos?page=999999999999',{token:live})).status,400);
  assert.equal((await call('/relatorio/cadastros/produtos?marca=999999999999',{token:live})).status,400);
  current.role='readonly';
  assert.equal((await call('/produto?limit=1',{token:live})).status,200);
  assert.equal((await call('/me',{token:live})).data.user.profileName,'Somente leitura');
  for(const [route,method] of [['/produto','POST'],['/produto/1','PUT'],['/produto/1','DELETE'],['/produto/1/excluir-tudo','POST'],['/marca/1','DELETE'],['/familia/1','PUT'],['/fornecedor/1','DELETE'],['/estoque/movimentar','POST'],['/estoque/movimentacao','POST'],['/produtos/restaurar/1','POST'],['/produtos/lixeira/1','DELETE'],['/alertas/resolver/1','PATCH'],['/perfis','POST'],['/perfis/user','PUT'],['/usuarios/1/role','PUT']])
    assert.equal((await call(route,{token:live,method,body:{}})).status,403,route);
  current.role='admin';assert.equal((await call('/usuarios',{token:live})).status,200);
  current.role='user';assert.equal((await call('/usuarios',{token:live})).status,403);
  current.is_active=false;assert.equal((await call('/me',{token:live})).status,401);assert.equal((await call('/login',{method:'POST',body:{email:current.email,password}})).status,401);current.is_active=true;
  const oldHash=current.password_hash;current.password_hash=await bcrypt.hash('different-password',4);assert.equal((await call('/me',{token:live})).status,401);current.password_hash=oldHash;
  assert.equal((await call('/logout',{token:live,method:'POST'})).status,204);assert.equal((await call('/me',{token:live})).status,401);
  const id=jwt.decode(live).jti;assert.equal(JSON.parse(fs.readFileSync(file))[id]>0,true);
  for(let i=0;i<12;i++)login=await call('/login',{method:'POST',body:{email:current.email,password:'wrong'}});assert.equal(login.status,429);
  console.log('PASS:',count,'requisições: rotas privadas, login, status/perfil atual, expiração, senha, logout persistido, rate limit e regressão de consultas/CSV. Nenhum cadastro real alterado.');
 }finally{
  access.profilePermissions=profileOriginal;access.saveProfile=saveOriginal;
  for(const [controller,key,fn] of controllerOriginals)controller[key]=fn;
  users.buscarUsuarioPorId=originals.byId;users.buscarUsuarioPorEmail=originals.byEmail;
  await new Promise(r=>server.close(r));const pool=await require(path+'/dist/models/db').connectToDatabase();await pool.close();
  fs.rmSync(file,{force:true});fs.rmSync(file+'.tmp',{force:true});
 }
})().catch(e=>{console.error(e.name,e.message);process.exitCode=1;});
