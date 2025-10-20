// Importaciones principales
const logger = require('./src/utils/logger');
const app = require('./src/app');
const { validateConnectionBD, closePool } = require('./src/config/database.config');
const config = require('./src/config/env.config');

// Configuración general
const { server, env, loadedEnvFile } = config;
const PORT = server.port;
const MODE = env;
const ENVFILE = loadedEnvFile;

// Función principal (autoejecutable)
(async () => {
  try {
    // 1. Verificar conexión a la base de datos
    await validateConnectionBD();

    // 2. Iniciar el servidor
    const serverInstance = app.listen(PORT, () => {
      logger.info(`[SERVER] Servidor escuchando en http://localhost:${PORT}`);
      logger.info(`[ENV] Servidor iniciado en modo: ${MODE.toUpperCase()} (${ENVFILE})`);
    });

    // 3. Apagado controlado (graceful shutdown)
    const gracefulShutdown = async (signal) => {
      logger.info(`[SHUTDOWN] Señal recibida (${signal}). Cerrando recursos...`);

      try {
        // Detener el servidor HTTP
        await new Promise((resolve, reject) => {
          serverInstance.close((err) => (err ? reject(err) : resolve()));
        });
        logger.info('[SHUTDOWN] Servidor cerrado correctamente.');

        // Cerrar conexión a la base de datos
        await closePool();

        logger.info('[SHUTDOWN] Recursos liberados correctamente.');
        process.exit(0);
      } catch (err) {
        logger.error('[SHUTDOWN] Error al liberar recursos:', err);
        process.exit(1);
      }
    };

    // Captura de señales del sistema
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    // 4. Manejo global de errores no controlados
    process.on('uncaughtException', (err) => {
      logger.fatal('[UNCAUGHT EXCEPTION]', err);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      logger.fatal('[UNHANDLED REJECTION]', reason);
      gracefulShutdown('unhandledRejection');
    });
  } catch (err) {
    // Error crítico al iniciar el servidor
    logger.error('[CRITICAL] Error durante la inicialización:', err);
    process.exit(1);
  }
})();
