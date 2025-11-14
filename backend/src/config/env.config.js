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
    port: Number(process.env.PORT),
    // Límite máximo del cuerpo de las peticiones (p. ej. '10mb')
    bodyLimit: process.env.BODY_LIMIT,
  },

  // Base de datos MySQL
  db: {
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    name: process.env.DATABASE_NAME,
  },

  // Autenticación (JWT)
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES,
  },

  // CORS
  cors: {
    origins: parseList(process.env.CORS_ORIGINS),
  },

  // Logging
  log: {
    level: process.env.LOG_LEVEL,
  },

  // Gemini API
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_CHAT_MODEL,
    temperature: Number(process.env.GEMINI_TEMPERATURE),
    maxTokens: Number(process.env.GEMINI_MAX_TOKENS),
  },

  // Gmail Bot
  gmail: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI,
    refreshToken: process.env.REFRESH_TOKEN,
  },
};

// =========================================================
// Validación de variables requeridas
// =========================================================
const requiredEnvVars = [
  'PORT',
  'DATABASE_HOST',
  'DATABASE_PORT',
  'DATABASE_USER',
  'DATABASE_PASSWORD',
  'DATABASE_NAME',
  'JWT_SECRET',
  'JWT_EXPIRES',
  'JWT_REFRESH_EXPIRES',
  'CORS_ORIGINS',
  'LOG_LEVEL',
  'GEMINI_API_KEY',
  'GEMINI_CHAT_MODEL',
  // 'GEMINI_TEMPERATURE',
  // 'GEMINI_MAX_TOKENS',
  // 'CLIENT_ID',
  // 'CLIENT_SECRET',
  // 'REDIRECT_URI',
  // 'REFRESH_TOKEN',
];

const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  console.error('Faltan variables de entorno requeridas:\n', missingVars.join('\n'));
  process.exit(1);
}

module.exports = config;
