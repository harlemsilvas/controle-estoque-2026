const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.env.FRONTEND_ROOT || 'dist');
const port = Number(process.env.FRONTEND_PORT || 4173);
const mime = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2'};
http.createServer((req,res) => {
  if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
  let requested;
  try { requested = decodeURIComponent((req.url || '/').split('?')[0]); } catch { res.writeHead(400); res.end(); return; }
  const candidate = path.resolve(root, '.' + requested);
  const relative = path.relative(root, candidate);
  if (relative.startsWith('..') || path.isAbsolute(relative) || requested.includes('\0') || requested.includes('\\')) { res.writeHead(403); res.end(); return; }
  const isFile = fs.existsSync(candidate) && fs.statSync(candidate).isFile();
  const file = isFile ? candidate : path.join(root,'index.html');
  if (fs.existsSync(file)) {
    const realRelative = path.relative(fs.realpathSync(root), fs.realpathSync(file));
    if (realRelative.startsWith('..') || path.isAbsolute(realRelative)) { res.writeHead(403); res.end(); return; }
  }
  if (!isFile && (requested.startsWith('/assets/') || path.extname(requested))) { res.writeHead(404); res.end(); return; }
  fs.readFile(file,(e,data) => {
    if (e) { res.writeHead(503); res.end('Frontend indisponivel'); return; }
    res.writeHead(200,{'Content-Type':mime[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}).listen(port,'0.0.0.0');

