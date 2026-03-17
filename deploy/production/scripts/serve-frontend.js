const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number.parseInt(process.env.FRONTEND_PORT || '4173', 10);
const rootDir = path.resolve(__dirname, '..', 'frontend', 'dist');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const sendFile = (filePath, res) => {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Erro ao ler arquivo.');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
    });
    res.end(content);
  });
};

const server = http.createServer((req, res) => {
  const requestPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const normalizedPath = path.normalize(requestPath).replace(/^\\+|^\/+/, '');
  const candidatePath = path.join(rootDir, normalizedPath);

  if (!candidatePath.startsWith(rootDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Acesso negado.');
    return;
  }

  fs.stat(candidatePath, (statError, stats) => {
    if (!statError && stats.isFile()) {
      sendFile(candidatePath, res);
      return;
    }

    sendFile(path.join(rootDir, 'index.html'), res);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[frontend] Servindo arquivos estaticos em http://localhost:${port}`);
});
