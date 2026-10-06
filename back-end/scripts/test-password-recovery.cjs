const root=require('path').resolve(__dirname,'..');
require(root+'/node_modules/dotenv').config({path:root+'/.env'});
const assert=require('assert/strict'),crypto=require('crypto'),jwt=require(root+'/node_modules/jsonwebtoken'),bcrypt=require(root+'/node_modules/bcryptjs');
process.env.PASSWORD_RECOVERY_ENABLED='true';process.env.APP_PUBLIC_URL='https://estoque.example.invalid';process.env.SMTP_HOST='smtp.example.invalid';process.env.MAIL_FROM='estoque@example.invalid';
(async()=>{
 const users=require(root+'/dist/services/usuarioService'),recovery=require(root+'/dist/services/password-recovery'),security=require(root+'/dist/middleware/session-security');
 const db=require(root+'/dist/models/db');db.connectToDatabase=async()=>{throw new Error('Acesso real ao banco bloqueado no teste.');};
 let current={id:901,email:'teste@example.invalid',username:'fixture',role:'user',is_active:true,password_hash:await bcrypt.hash('old-test-password',4)};
 users.buscarUsuarioPorId=async id=>id===current.id?{...current}:null;users.buscarUsuarioPorEmail=async email=>email===current.email?{...current}:null;
 let writes=0,deliveries=[];
 const replace=async(id,before,after)=>{if(id!==current.id || !current.is_active || current.password_hash!==before)return false;current.password_hash=after;writes++;return true;};
 const deliver=async(to,link)=>{deliveries.push({to,link});};
 await recovery.requestRecovery('unknown@example.invalid',deliver);assert.equal(deliveries.length,0);
 current.is_active=false;await recovery.requestRecovery(current.email,deliver);assert.equal(deliveries.length,0);current.is_active=true;
 await recovery.requestRecovery(current.email,deliver);assert.equal(deliveries.length,1);
 const link=new URL(deliveries[0].link),token=new URLSearchParams(link.hash.slice(1)).get('token');assert.equal(link.pathname,'/reset-password');assert.equal(link.search,'');
 assert.throws(()=>jwt.verify(token,security.jwtSecret(),{algorithms:['HS256']}));
 await assert.rejects(recovery.resetPassword(token,'short',replace),e=>e.status===400);
 await assert.rejects(recovery.resetPassword('invalid','new-test-password',replace),e=>e.status===400);
 const key=crypto.createHmac('sha256',security.jwtSecret()).update('controle-estoque/password-recovery/v1').digest('hex');
 const expired=jwt.sign({id:current.id,stamp:security.passwordStamp(current.password_hash)},key,{expiresIn:-1,audience:'password-recovery',issuer:'controle-estoque',jwtid:crypto.randomUUID()});
 await assert.rejects(recovery.resetPassword(expired,'new-test-password',replace),e=>e.status===400);
 const oldStamp=security.passwordStamp(current.password_hash);await recovery.resetPassword(token,'new-test-password',replace);assert.equal(writes,1);assert(await bcrypt.compare('new-test-password',current.password_hash));assert.notEqual(oldStamp,security.passwordStamp(current.password_hash));
 await assert.rejects(recovery.resetPassword(token,'another-password',replace),e=>e.status===400);
 const concurrent=recovery.createRecoveryToken(current);const attempts=await Promise.allSettled([recovery.resetPassword(concurrent,'concurrent-password-1',replace),recovery.resetPassword(concurrent,'concurrent-password-2',replace)]);
 assert.equal(attempts.filter(r=>r.status==='fulfilled').length,1);assert.equal(writes,2);
 const inactive=recovery.createRecoveryToken(current);current.is_active=false;await assert.rejects(recovery.resetPassword(inactive,'another-password',replace),e=>e.status===400);current.is_active=true;
 const saved=recovery.createRecoveryToken(current);current.password_hash=await bcrypt.hash('admin-changed-password',4);await assert.rejects(recovery.resetPassword(saved,'another-password',replace),e=>e.status===400);
 // Exercitar controller e middleware sem conectar/enviar mensagens reais.
 const originalRequest=recovery.requestRecovery,originalReset=recovery.resetPassword;
 recovery.requestRecovery=email=>originalRequest(email,deliver);recovery.resetPassword=(token,password)=>originalReset(token,password,replace);
 const access=require(root+'/dist/services/access-profiles');access.profilePermissions=async()=>({name:'Teste',permissions:['products.read']});
 const app=require(root+'/dist/app').default,server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));const base='http://127.0.0.1:'+server.address().port;
 async function post(route,body){const res=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:res.status,data:await res.json()};}
 try {
  const unknown=await post('/recuperar-senha',{email:'unknown@example.invalid'}),known=await post('/recuperar-senha',{email:current.email});assert.equal(known.status,202);assert.deepEqual(unknown,known);
  const resetToken=new URLSearchParams(new URL(deliveries.at(-1).link).hash.slice(1)).get('token');
  const denied=await fetch(base+'/me',{headers:{Authorization:'Bearer '+resetToken}});assert.equal(denied.status,401);
  assert.equal((await post('/reset-password',{token:resetToken,newPassword:'http-test-password'})).status,200);
  assert.equal((await post('/reset-password',{token:resetToken,newPassword:'http-test-password'})).status,400);
  for(let i=0;i<4;i++)await post('/recuperar-senha',{email:'unknown@example.invalid'});
  assert.equal((await post('/recuperar-senha',{email:'unknown@example.invalid'})).status,429);
  console.log('PASS: recuperação, resposta genérica, token separado da sessão, expiração/reuso, concorrência, conta inativa, troca administrativa, rate limit e HTTP. Sem banco ou SMTP reais.');
 }finally{await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e.name,e.message);process.exitCode=1;});
