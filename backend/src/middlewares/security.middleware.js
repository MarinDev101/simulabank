const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');

const securityMiddleware = (app) => {
  // Helmet para headers de seguridad
  app.use(helmet());

  // Limitar peticiones por IP
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // límite de 100 peticiones por ventana
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(limiter);

  // Sanitizar inputs
  app.use(xss());
};

module.exports = securityMiddleware;

