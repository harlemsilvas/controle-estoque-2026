const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS para permitir acesso da rede local
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173', 
    'http://192.168.0.69:5173',
    'http://192.168.0.69:3000',
    /^http:\/\/192\.168\.0\.\d+(:\d+)?$/, // Permite qualquer IP da sub-rede
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware para headers manuais (backup)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

// Servir frontend estático do Vite
app.use(express.static(path.join(__dirname, 'front-end/dist')));

// Importar e usar as rotas do backend compilado
const backendApp = require('./back-end/dist/app');
app.use('/api', backendApp); // Ou ajuste conforme suas rotas

// Fallback para SPA: qualquer rota não-API serve o index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'front-end/dist', 'index.html'));
  }
});

// ✅ O SEGREDO: Escutar em 0.0.0.0 para aceitar conexões externas
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando em: http://192.168.0.69:${PORT}`);
  console.log(`🌐 Acesso local: http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://192.168.0.69:${PORT}/api-docs`);
});