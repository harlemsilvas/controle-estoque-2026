import { Request, Response, NextFunction } from 'express';
interface CustomError extends Error { status?: number; }
export default function errorHandler(err: CustomError, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || 500;
  if (status >= 500) console.error('Falha interna na API; detalhes sensíveis não registrados.');
  res.status(status).json({ error: status >= 500 ? 'Erro interno do servidor.' : err.message || 'Requisição inválida.' });
}
