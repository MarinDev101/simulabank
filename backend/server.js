const app = require('./src/app');
// Validar variables de entorno al inicio
require('dotenv-safe').config({ example: './.env.example' });
const logger = require('./src/utils/logger');
const { pool } = require('./src/config/database.config');
const tokenService = require('./src/services/token.service');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`Servidor corriendo en http://localhost:${PORT}`);
});
// Inicializar token service (Redis si REDIS_URL presente)
tokenService.init(process.env.REDIS_URL).then(() => {
  logger.info('Token service inicializado');
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Iniciando graceful shutdown...');
  server.close(async (err) => {
    if (err) {
      logger.error('Error cerrando server', err);
      process.exit(1);
    }
    try {
      await pool.end();
      logger.info('Pool de BD cerrado.');
      process.exit(0);
    } catch (e) {
      logger.error('Error cerrando pool', e);
      process.exit(1);
    }
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
