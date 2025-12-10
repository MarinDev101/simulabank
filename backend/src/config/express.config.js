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

  // ============================================
  // RATE LIMITING - Estándar de la industria
  // ============================================

  // Rate limiter global (API general)
  // Estándar: 100-500 req/min para APIs públicas
  const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto (ventana corta para mejor control)
    max: 100, // 100 peticiones por minuto por IP
    standardHeaders: true, // Incluye `RateLimit-*` headers
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Demasiadas peticiones, por favor intenta de nuevo en un momento.',
    },
    skip: () => isDevelopment, // Desactivar en desarrollo
  });
  app.use(globalLimiter);

  // Sanitización de datos (XSS / inyección)
  app.use(securityMiddleware);

  // Logging solo en desarrollo
  if (isDevelopment) {
    const stream = { write: (msg) => logger.http(msg.trim()) };
    app.use(morgan('tiny', { stream }));
  }

  return app;
}

// ============================================
// RATE LIMITERS ESPECÍFICOS (para exportar)
// ============================================

// Rate limiter para login/registro (más estricto para prevenir fuerza bruta)
// Estándar: 5-10 intentos por 15 minutos
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto (antes 15 min)
  max: 1000, // 1000 intentos (antes 10) - Restricción relajada
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación, intenta de nuevo en un momento.',
  },
  skipFailedRequests: false,
  skip: () => isDevelopment, // Desactivar en desarrollo
});

// Rate limiter para endpoints de creación (POST)
// Estándar: 30-50 creaciones por minuto
const createLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 1000, // 1000 creaciones (antes 30) - Restricción relajada
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Has creado demasiados recursos, espera un momento.',
  },
  skip: () => isDevelopment, // Desactivar en desarrollo
});

// Rate limiter para operaciones sensibles (cambio de contraseña, etc.)
// Estándar: 5 intentos por hora
const sensitiveLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto (antes 1 hora)
  max: 100, // 100 intentos (antes 5) - Restricción relajada
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados intentos, por favor espera una hora.',
  },
});

// Rate limiter para reenvío de códigos de verificación
// Permite reenvíos frecuentes pero con límite razonable
const resendCodeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 10, // 10 intentos por cada 5 minutos
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados intentos de reenvío, espera unos minutos.',
  },
});

module.exports = createExpressApp;
module.exports.authLimiter = authLimiter;
module.exports.createLimiter = createLimiter;
module.exports.sensitiveLimiter = sensitiveLimiter;
module.exports.resendCodeLimiter = resendCodeLimiter;
