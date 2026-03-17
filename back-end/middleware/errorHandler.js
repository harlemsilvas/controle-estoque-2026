// middleware/errorHandler.js

function errorHandler(err, req, res, next) {
  console.error('Erro:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

module.exports = errorHandler;
