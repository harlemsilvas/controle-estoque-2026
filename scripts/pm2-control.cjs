const fs = require('fs');
const pm2 = require(process.argv[2]);
const [mode, file] = process.argv.slice(3);
// Evitar mensagens de inicializacao do daemon no canal JSON de controle.
console.log = () => {};
const call = (method, ...args) => new Promise((resolve, reject) => pm2[method](...args, (e, v) => e ? reject(e) : resolve(v)));
function previousOptions(app) {
  const e = app.pm2_env;
  const env = {};
  for (const key of ['NODE_ENV','PORT','FRONTEND_PORT','FRONTEND_ROOT','SESSION_REVOCATION_FILE','APP_PUBLIC_URL','PM2_SERVE_PATH','PM2_SERVE_PORT','PM2_SERVE_SPA']) {
    if (e[key] !== undefined) env[key] = e[key];
    else if (e.env && e.env[key] !== undefined) env[key] = e.env[key];
  }
  return {name:app.name,script:e.pm_exec_path,cwd:e.pm_cwd,interpreter:e.exec_interpreter,env,watch:false};
}
(async () => {
  await call('connect');
  const apps = await call('list');
  if (mode === 'list') {
    process.stdout.write(JSON.stringify(apps.map(a => ({name:a.name,pid:a.pid,status:a.pm2_env.status,script:a.pm2_env.pm_exec_path,cwd:a.pm2_env.pm_cwd}))));
    return;
  }
  if (!['apply','ensure','snapshot'].includes(mode)) throw new Error('Invalid mode');
  const config = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  if (!Array.isArray(config.apps) || config.apps.length !== 2) throw new Error('Invalid configuration');
  const names = config.apps.map(a => a.name);
  if (new Set(names).size !== 2 || names.some(n => !/^controle-estoque(?:-2026)?-(backend|frontend|api-teste|web-teste)$/.test(n))) throw new Error('Invalid names');
  const oldApps = apps.filter(a => names.includes(a.name));
  const previous = oldApps.map(previousOptions);
  if (mode === 'snapshot') { process.stdout.write(JSON.stringify({apps:previous})); return; }
  try {
    for (const desired of config.apps) {
      const old = oldApps.find(a => a.name === desired.name);
      if (mode === 'ensure' && old && old.pm2_env.status === 'online') continue;
      if (old) await call('delete', desired.name);
      await call('start', desired);
    }
  } catch (e) {
    if (mode === 'apply') {
      const now = await call('list');
      for (const app of now.filter(a => names.includes(a.name))) await call('delete', app.name).catch(() => {});
      for (const old of previous) await call('start', old).catch(() => {});
    }
    throw e;
  }
})().catch(() => { console.error('PM2: operacao falhou; detalhes sensiveis omitidos.'); process.exitCode = 1; })
.finally(() => pm2.disconnect());



