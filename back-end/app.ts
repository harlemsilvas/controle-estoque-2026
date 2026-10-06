// ...existing code...
import express from 'express';
import { reportCadastros } from './controllers/cadastroReports';
import { recover, reset } from './controllers/passwordController';
import { recoveryLimit } from './middleware/recovery-limit';
import cors from 'cors';
import sql from 'mssql';
import dotenv from 'dotenv';
import authenticateToken, { requireAdmin, requirePermission, AuthRequest } from './middleware/authMiddleware';
import { requiredPermission } from './middleware/access-policy';
import { listProfiles, permissionGroups, saveProfile } from './services/access-profiles';
import { jwtSecret, revokeSession } from './middleware/session-security';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import errorHandler from './middleware/errorHandler';
import { relatorioMovimentacoes } from './controllers/relatorioController';
// Controllers
import produtoController from './controllers/produtoController';
import estoqueController from './controllers/estoqueController';
import fornecedorController from './controllers/fornecedorController';
import marcaController from './controllers/marcaController';
import familiaController from './controllers/familiaController';
import usuarioController from './controllers/usuarioController';
import authController from './controllers/authController';
import alertaController from './controllers/alertaController';
import { connectToDatabase } from './models/db';

dotenv.config();
jwtSecret();

const app = express();
const port = process.env.PORT || 3000;

// Confiar no proxy (importante para produção com nginx/reverse proxy)
app.set('trust proxy', process.env.TRUST_PROXY === '1' ? 1 : false);

// CORS configuration
// localhost origins (dev + production local) + LAN sub-rede 192.168.0.x
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://estoque.local',
  'https://estoque.local',  // ← ADICIONAR ESTA LINHA!
  /^https?:\/\/192\.168\.0\.\d+(:\d+)?$/,
];

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Aceita qualquer origem da sub-rede LAN 192.168.x.x
  try {
    const url = new URL(origin);
    return /^192\.168\./.test(url.hostname);
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  })
);

// Explicit CORS header middleware to ensure header is always set
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  next();
});
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

function healthHandler(_req: express.Request, res: express.Response) {
  res.status(200).json({
    status: 'ok',
    service: 'controle-estoque-backend',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}

app.get('/health', healthHandler);
app.get('/saude', healthHandler);

// Login público; dados e operações abaixo exigem sessão válida.
const attempts = new Map<string, { count: number; until: number }>();
app.post('/login', (req, res, next) => {
  const now = Date.now();
  for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
  const key = req.ip || 'unknown';
  const entry = attempts.get(key) || { count: 0, until: now + 15 * 60 * 1000 };
  if (entry.count >= 10) {
    res.setHeader('Retry-After', String(Math.max(1, Math.ceil((entry.until - now) / 1000))));
    return res.status(429).json({ error: 'Muitas tentativas. Aguarde para tentar novamente.' });
  }
  if (!attempts.has(key) && attempts.size >= 10000) return res.status(429).json({ error: 'Aguarde para tentar novamente.' });
  entry.count++; attempts.set(key, entry);
  res.on('finish', () => { if (res.statusCode < 400) attempts.delete(key); });
  next();
}, authController.login);
app.post('/forcar-senha', (_req, res) => res.status(410).json({ error: 'Use a redefinição administrativa autenticada.' }));
app.post('/recuperar-senha', recoveryLimit(), recover);
app.post('/reset-password', recoveryLimit(), reset);
app.use(authenticateToken);
app.get('/me', (req, res) => res.json({ user: (req as AuthRequest).user }));
app.post('/logout', (req, res, next) => {
  try {
    const session = (req as AuthRequest).session!;
    revokeSession(session.id, session.expiry); res.status(204).send();
  } catch (error) { next(error); }
});
app.use((req, res, next) => {
  if (['/estoque/movimentar', '/estoque/movimentacao'].includes(req.path)) {
    req.body.usuario = (req as AuthRequest).user!.username;
  }
  const permission = requiredPermission(req);
  if (!permission) return res.status(404).json({ error: 'Rota não encontrada.' });
  // Perfil do usuário pode ser escolhido por quem mantém usuários.
  if (req.path === '/perfis' && req.method === 'GET' && (req as AuthRequest).user!.permissions.includes('users.read')) return next();
  return requirePermission(permission)(req, res, next);
});


app.get('/perfis', async (_req, res, next) => {
  try { res.json({ profiles: await listProfiles(), groups: permissionGroups }); } catch (error) { next(error); }
});
app.post('/perfis', async (req, res, next) => {
  try { res.status(201).json(await saveProfile(req.body, (req as AuthRequest).user!.id, true)); } catch (error) { next(error); }
});
app.put('/perfis/:code', async (req, res, next) => {
  try { res.json(await saveProfile({ ...req.body, code: req.params.code }, (req as AuthRequest).user!.id, false)); } catch (error) { next(error); }
});

// Relatório de movimentações de estoque
app.get('/relatorio/cadastros/:resource', reportCadastros);
app.get('/relatorio/movimentacoes', relatorioMovimentacoes);
// Estoque resumo (15 mais e 15 menos)
app.get('/estoque-produto', estoqueController.getEstoqueResumo);

// Produto por barcode
app.get('/produto/barcode/:barcode', produtoController.getProdutoPorBarcode);
// ...existing code...
app.get('/produtos/busca', produtoController.buscarProdutos);

// Histórico de movimentação por barcode
app.get('/estoque/historico/:barcode', estoqueController.getHistoricoPorBarcode);

// Movimentar estoque por código do produto
app.post('/estoque/movimentar', estoqueController.movimentarEstoque);
// Movimentar estoque por código de barras
app.post('/estoque/movimentacao', estoqueController.movimentarPorBarcode);

// Rotas de analytics de valor de estoque
app.get('/estoque/valor-total', estoqueController.getValorTotalEstoque);
app.get('/estoque/valor-total-por-familia', estoqueController.getValorTotalPorFamilia);
app.get('/estoque/valor-total-por-marca', estoqueController.getValorTotalPorMarca);
app.get('/estoque/valor-total-por-fornecedor', estoqueController.getValorTotalPorFornecedor);

// Swagger setup
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Controle de Estoque API',
    version: '1.0.0',
    description: 'Documentação automática da API de controle de estoque',
  },
  servers: [
    {
      url: 'http://localhost:' + port,
      description: 'Servidor local',
    },
  ],
};
const options = {
  swaggerDefinition,
  apis: ['./controllers/*.ts'],
};
const swaggerSpec = swaggerJSDoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routers
const produtoRouter = express.Router();
const fornecedorRouter = express.Router();
const marcaRouter = express.Router();
const familiaRouter = express.Router();
const usuarioRouter = express.Router();

// Produto
produtoRouter.get('/', produtoController.listarTodos);
produtoRouter.patch('/:codigo/fornecedor', produtoController.associarOrfao);
produtoRouter.get('/:codigo', produtoController.buscarPorCodigo);
produtoRouter.post('/', produtoController.criar);
produtoRouter.put('/:codigo', produtoController.atualizar);
produtoRouter.delete('/:codigo', produtoController.remover);

// Rotas de lixeira
app.get('/produtos/lixeira', produtoController.listarLixeira);
app.get('/produto/lixeira/count', produtoController.contarLixeira);
app.post('/produtos/restaurar/:id', produtoController.restaurarProduto);
app.delete('/produtos/lixeira/:id', produtoController.excluirPermanentemente);

app.use('/produto', produtoRouter);

// Produto Aggregate
app.get('/produto-aggregate', produtoController.aggregate);

// Fornecedor
fornecedorRouter.get('/', fornecedorController.listarTodos);
fornecedorRouter.get('/:codigo', fornecedorController.buscarPorCodigo);
fornecedorRouter.post('/', fornecedorController.criar);
fornecedorRouter.put('/:codigo', fornecedorController.atualizar);
fornecedorRouter.delete('/:codigo', fornecedorController.remover);
app.use('/fornecedor', fornecedorRouter);

// Marca
marcaRouter.get('/', marcaController.listarTodos);
marcaRouter.get('/:codigo', marcaController.buscarPorCodigo);
marcaRouter.post('/', marcaController.criar);
marcaRouter.put('/:codigo', marcaController.atualizar);
marcaRouter.delete('/:codigo', marcaController.remover);
app.use('/marca', marcaRouter);

// Família
familiaRouter.get('/paginado', familiaController.listarPaginado);
familiaRouter.get('/', familiaController.listarTodos);
familiaRouter.get('/:codigo', familiaController.buscarPorCodigo);
familiaRouter.post('/', familiaController.criar);
familiaRouter.put('/:codigo', familiaController.atualizar);
familiaRouter.delete('/:codigo', familiaController.remover);
app.use('/familia', familiaRouter);

// Usuário
usuarioRouter.get('/', usuarioController.listarTodos);
usuarioRouter.post('/', usuarioController.criar);
usuarioRouter.put('/:id', usuarioController.atualizarDados);
usuarioRouter.put('/:id/status', usuarioController.atualizarStatus);
usuarioRouter.put('/:id/role', usuarioController.atualizarRole);
usuarioRouter.put('/:id/senha', usuarioController.atualizarSenha);
app.use('/usuarios', usuarioRouter);

// Alertas
app.get('/alertas/historico', alertaController.historico);
app.get('/alertas', alertaController.ativos);
app.patch('/alertas/resolver/:id', alertaController.resolverAlerta);

// Rota /totais deve ser registrada antes do middleware 404
app.get('/totais', async (req, res) => {
  try {
    console.log('Requisição recebida na rota /totais');
    const totalProdutos = await sql.query`SELECT COUNT(*) AS total FROM PRODUTO`;
    const totalMovimentacoes = await sql.query`SELECT COUNT(*) AS total FROM ESTOQUE_PRODUTO`;
    const totalMarcas = await sql.query`SELECT COUNT(*) AS total FROM MARCA_PRODUTO`;
    const totalFamilias = await sql.query`SELECT COUNT(*) AS total FROM FAMILIA_PRODUTO`;
    const totalFornecedores = await sql.query`SELECT COUNT(*) AS total FROM FORNECEDOR`;

    console.log('Dados obtidos:', {
      produtos: totalProdutos.recordset[0].total,
      movimentacoes: totalMovimentacoes.recordset[0].total,
      marcas: totalMarcas.recordset[0].total,
      familias: totalFamilias.recordset[0].total,
      fornecedores: totalFornecedores.recordset[0].total,
    });

    res.json({
      produtos: totalProdutos.recordset[0]?.total || 0,
      movimentacoes: totalMovimentacoes.recordset[0]?.total || 0,
      marcas: totalMarcas.recordset[0]?.total || 0,
      familias: totalFamilias.recordset[0]?.total || 0,
      fornecedores: totalFornecedores.recordset[0]?.total || 0,
    });
  } catch (err) {
    if (err instanceof Error) {
      console.error('Erro ao buscar totais:', err.message);
    } else {
      console.error('Erro ao buscar totais:', err);
    }
    res.status(500).json({ error: 'Erro ao buscar totais.' });
  }
});

// Middleware para rotas não encontradas (404)
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Middleware global de tratamento de erros (deve ser o último)
app.use(errorHandler);

export default app;
if (require.main === module) {
  connectToDatabase().then(() => {
    app.listen(port, () => console.log(`Servidor rodando em http://localhost:${port}`));
  }).catch(() => { console.error('Falha de conexão com banco ao iniciar backend.'); process.exit(1); });
}
