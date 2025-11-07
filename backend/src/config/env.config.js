// =========================================================
// Configuración centralizada y segura
// =========================================================
const dotenv_safe = require('dotenv-safe');
const path = require('path');

// Determinar entorno
const ENV = process.env.NODE_ENV || 'development';
const envFile = `.env.${ENV}`;

dotenv_safe.config({
  path: path.resolve(process.cwd(), envFile),
  example: path.resolve(process.cwd(), '.env.example'),
  allowEmptyValues: true,
});

const isDevelopment = ENV === 'development';
const isProduction = ENV === 'production';

// =========================================================
// Valores por defecto centralizados
// =========================================================
const DEFAULTS = {
  port: 3000,
  dbPort: 3306,
  jwtExpires: '2h',
  jwtRefreshExpires: '7d',
  corsOrigins: ['*'],
  logLevel: 'info',
  bodyLimit: '10mb',
};

// =========================================================
// Helper para parsear listas separadas por comas
// =========================================================
const parseList = (value, fallback = []) => {
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return fallback;
};

// =========================================================
// Configuración general
// =========================================================
const config = {
  env: ENV,
  isProduction,
  isDevelopment,
  loadedEnvFile: envFile,

  // Servidor
  server: {
    port: Number(process.env.PORT) || DEFAULTS.port,
    // Límite máximo del cuerpo de las peticiones (p. ej. '10mb')
    bodyLimit: process.env.BODY_LIMIT || DEFAULTS.bodyLimit,
  },

  // Base de datos MySQL
  db: {
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT) || DEFAULTS.dbPort,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    name: process.env.DATABASE_NAME,
  },

  // Autenticación (JWT)
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES || DEFAULTS.jwtExpires,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || DEFAULTS.jwtRefreshExpires,
  },

  // CORS
  cors: {
    origins: parseList(process.env.CORS_ORIGINS, DEFAULTS.corsOrigins),
  },

  // Logging
  log: {
    level: process.env.LOG_LEVEL || DEFAULTS.logLevel,
  },

  // Google AI / Gemini (opcional)
  google: {
    apiKey: process.env.GOOGLE_API_KEY || null,
    geminiModel: process.env.GOOGLE_GEMINI_MODEL || null,
  },

  // Gmail Bot (opcional)
  gmail: {
    clientId: process.env.CLIENT_ID || null,
    clientSecret: process.env.CLIENT_SECRET || null,
    redirectUri: process.env.REDIRECT_URI || null,
    refreshToken: process.env.REFRESH_TOKEN || null,
  },
};

if (!config.jwt.secret) {
  console.warn('JWT_SECRET no definido. Usa un valor seguro en producción.');
}

module.exports = config;
