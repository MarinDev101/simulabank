// Middleware global de errores
const logger = require('../utils/logger');

/* eslint-disable-next-line no-unused-vars */
function errorHandler(err, req, res, _next) {
  logger.error(err);

  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(status).json({
    success: false,
    error: message,
  });
}

module.exports = errorHandler;
