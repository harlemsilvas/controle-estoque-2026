const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{spawnSync,spawn}=require('child_process'),http=require('http');
const root=path.resolve(__dirname,'..'),fixture=path.join(root,'.codex','startup-fixture');
fs.mkdirSync(fixture,{recursive:true});
const mock=path.join(fixture,'mock-pm2.cjs'),config=path.join(fixture,'ecosystem.json'),calls=path.join(fixture,'calls.json');
fs.writeFileSync(mock,`const fs=require('fs');let apps=[{name:'controle-estoque-backend',pid:1,pm2_env:{status:'online',pm_exec_path:'/old/backend.js',pm_cwd:'/old',env:{PORT:'4300',SECRET:'fixture-secret'}}},{name:'controle-estoque-frontend',pid:2,pm2_env:{status:'online',pm_exec_path:'/old/frontend.js',pm_cwd:'/old',env:{FRONTEND_PORT:'4173'}}}];const calls=[];const save=()=>fs.writeFileSync(process.env.MOCK_CALLS,JSON.stringify(calls));module.exports={connect(cb){cb(null);},disconnect(){save();},list(cb){cb(null,apps);},delete(name,cb){calls.push(['delete',name]);apps=apps.filter(a=>a.name!==name);cb(null);},start(opts,cb){calls.push(['start',opts]);if(process.env.MOCK_FAIL==='1'&&opts.script==='/new/backend.js'){cb(new Error('fixture failure'));return;}apps.push({name:opts.name,pm2_env:{status:'online',...opts}});cb(null);}};`);
fs.writeFileSync(config,JSON.stringify({apps:[{name:'controle-estoque-backend',script:'/new/backend.js',cwd:'/new',env:{PORT:'4300'}},{name:'controle-estoque-frontend',script:'/new/frontend.js',cwd:'/new',env:{FRONTEND_PORT:'4173'}}]}));
function run(mode,fail=false){return spawnSync(process.execPath,[path.join(root,'scripts','pm2-control.cjs'),mock,mode,config],{encoding:'utf8',env:{...process.env,MOCK_CALLS:calls,MOCK_FAIL:fail?'1':'0'},timeout:10000});}
let r=run('snapshot');assert.equal(r.status,0);assert.equal(JSON.parse(r.stdout).apps.length,2);assert(!r.stdout.includes('fixture-secret'));
r=run('ensure');assert.equal(r.status,0);assert.equal(JSON.parse(fs.readFileSync(calls)).length,0);
r=run('apply');assert.equal(r.status,0);assert.equal(JSON.parse(fs.readFileSync(calls)).filter(x=>x[0]==='start').length,2);
r=run('apply',true);assert.equal(r.status,1);const restored=JSON.parse(fs.readFileSync(calls)).filter(x=>x[0]==='start').map(x=>x[1].script);assert(restored.includes('/old/backend.js'));assert(restored.includes('/old/frontend.js'));
console.log('PASS: PM2 simulado, consulta sem segredos, preservacao online, troca e restauracao apos falha.');
(async()=>{
 const site=path.join(fixture,'dist');fs.mkdirSync(path.join(site,'assets'),{recursive:true});fs.writeFileSync(path.join(site,'index.html'),'<html>fixture</html>');fs.writeFileSync(path.join(site,'assets','app.js'),'fixture');
 const port=await new Promise(resolve=>{const s=http.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
 const child=spawn(process.execPath,[path.join(root,'scripts','serve-site.cjs')],{env:{...process.env,FRONTEND_ROOT:site,FRONTEND_PORT:String(port)},stdio:'ignore'});
 const request=p=>new Promise((resolve,reject)=>http.get({hostname:'127.0.0.1',port,path:p},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));}).on('error',reject));
 try {let ready=false;for(let i=0;i<40;i++){try{if(await request('/')===200){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}assert(ready);assert.equal(await request('/produtos'),200);assert.equal(await request('/assets/app.js'),200);assert.equal(await request('/assets/missing.js'),404);assert.equal(await request('/..%2Foutside.txt'),403);console.log('PASS: frontend estatico, rota SPA, assets, 404 e bloqueio de travessia.');}
 finally{child.kill();}
})().catch(()=>{console.error('Falha no teste do frontend estatico.');process.exitCode=1;});
