const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
// const path = require('path');

// Importar configuración
const { validateConnectionBD, pool } = require('./config/database.config');

// Importar rutas
const productosRoutes = require('./routes/productos.routes');

// Middlewares locales
const securityMiddleware = require('./middlewares/security.middleware');
const errorHandler = require('./middlewares/error.middleware');
// const { authenticateJWT } = require('./middlewares/jwt.middleware');
const logger = require('./utils/logger');

const app = express();

// Seguridad y parsing
app.use(express.json({ limit: '10kb' }));
// Configurar CORS: en produccion se espera lista separada por comas en CORS_ORIGINS
const corsEnv = process.env.CORS_ORIGINS || '*';
let corsOptions = {};
if (corsEnv === '*') {
  corsOptions = { origin: '*' };
} else {
  const origins = corsEnv.split(',').map(o => o.trim()).filter(Boolean);
  corsOptions = {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow non-browser requests like curl
      if (origins.indexOf(origin) !== -1) return callback(null, true);
      callback(new Error('CORS policy: origin not allowed'));
    },
  };
}
app.use(cors(corsOptions));
securityMiddleware(app);

// Logging HTTP
app.use(morgan('combined'));

// Conectar base de datos
validateConnectionBD();

// Rutas
app.get('/', (req, res) => {
  res.send('Ruta INICIO');
});

// Health check
app.get('/health', async (req, res) => {
  try {
    // Check DB
    const [rows] = await pool.query('SELECT 1');
    res.json({ status: 'ok', db: !!rows });
  } catch (err) {
    logger.error('Health check DB failed', err);
    res.status(500).json({ status: 'error' });
  }
});

// Rutas de la API
// Ejemplo: proteger rutas que lo requieran con authenticateJWT
app.use('/api/ejemplo', productosRoutes);

// Rutas de autenticación (ejemplo con validación)
const authSimpleRoutes = require('./routes/auth.simple.routes');
app.use('/api/auth', authSimpleRoutes);

// Middleware global de errores (al final)
app.use(errorHandler);

module.exports = app;
