const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { corsOptions } = require('./cors.config');
const securityMiddleware = require('../middlewares/security.middleware');
const logger = require('../utils/logger');
const { isDevelopment, server } = require('./env.config');

function createExpressApp() {
  const app = express();
  //! MUCHO CUIDADO SOLO PRUEBA
  app.set('trust proxy', 1);

  // Oculta cabecera "X-Powered-By"
  app.disable('x-powered-by');

  // Parseo de JSON y formularios
  // Usar el límite configurable (BODY_LIMIT) con valor por defecto razonable
  const bodyLimit = (server && server.bodyLimit) || '10mb';
  app.use(express.json({ limit: bodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: bodyLimit }));

  // Seguridad básica HTTP
  app.use(cors(corsOptions));
  app.use(helmet());

  // Compresión de respuestas
  app.use(compression());

  // Límite de peticiones global (protección DDoS)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máx. 100 peticiones por IP
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // Sanitización de datos (XSS / inyección)
  app.use(securityMiddleware);

  // Logging solo en desarrollo
  if (isDevelopment) {
    const stream = { write: (msg) => logger.http(msg.trim()) };
    app.use(morgan('tiny', { stream }));
  }

  return app;
}

module.exports = createExpressApp;
