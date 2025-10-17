const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { corsOptions } = require('./cors.config');
const securityMiddleware = require('../middlewares/security.middleware');
const logger = require('../utils/logger');
const { isDevelopment } = require('./env.config');

function createExpressApp() {
  const app = express();

  // Oculta cabecera "X-Powered-By"
  app.disable('x-powered-by');

  // Parseo de JSON y formularios
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

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
