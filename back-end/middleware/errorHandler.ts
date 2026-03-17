import { Request, Response } from 'express';

// Definição de tipo para erro customizado
interface CustomError extends Error {
  status?: number;
  stack?: string;
}

function errorHandler(err: CustomError, req: Request, res: Response) {
  console.error('Erro:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

export default errorHandler;
