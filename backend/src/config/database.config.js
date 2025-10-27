// =========================================================
// Configuración de conexión a la base de datos MySQL
// =========================================================
const logger = require('../utils/logger');
const mysql = require('mysql2/promise');
const { db } = require('./env.config');

// =========================================================
// Creación del pool de conexiones
// =========================================================
const pool = mysql.createPool({
  host: db.host,
  port: db.port,
  user: db.user,
  password: db.password,
  database: db.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Timeouts: ayuda a que las operaciones con la BD fallen rápido en lugar de quedarse "colgadas"
  connectTimeout: 10000, // ms para establecer conexión
  // acquireTimeout: 10000, // ms para obtener una conexión del pool
});

// =========================================================
// Verifica la conexión y existencia real de la base de datos
// =========================================================
async function validateConnectionBD() {
  logger.info('[DB] Iniciando validación de conexión y estructura de base de datos...');

  // Validar variables críticas antes de conectar
  const requiredVars = {
    DATABASE_HOST: db.host,
    DATABASE_PORT: db.port,
    DATABASE_USER: db.user,
    DATABASE_PASSWORD: db.password,
    DATABASE_NAME: db.name,
  };

  const missing = Object.entries(requiredVars)
    .filter(([, value]) => value === undefined || value === null || value === '')
    .map(([key]) => key);

  if (missing.length > 0) {
    const msg = `[DB] Variables de entorno faltantes: ${missing.join(', ')}`;
    logger.error(msg);
    // Lanzar para que el proceso no inicie el servidor en un estado inconsistente
    throw new Error(msg);
  }

  let connection;

  try {
    // Intentar conectar al servidor (sin seleccionar base todavía)
    logger.info(`[DB] Verificando conexión con el servidor MySQL (${db.host}:${db.port})...`);
    connection = await mysql.createConnection({
      host: db.host,
      port: db.port,
      user: db.user,
      password: db.password,
    });

    await connection.ping();
    logger.info('[DB] Servidor MySQL responde correctamente');

    // Comprobar si la base de datos existe
    logger.info(`[DB] Verificando existencia de la base de datos "${db.name}"...`);
    const [dbExists] = await connection.query(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [db.name]
    );

    if (dbExists.length === 0) {
      throw new Error(`No se encontró la base de datos "${db.name}" en el servidor.`);
    }

    logger.info(`[DB] Base de datos "${db.name}" encontrada correctamente`);

    // Comprobar si la base de datos tiene tablas
    logger.info(`[DB] Comprobando tablas dentro de "${db.name}"...`);
    const [tables] = await connection.query(
      'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?',
      [db.name]
    );

    if (tables.length === 0) {
      logger.warn(`[DB] La base de datos "${db.name}" no contiene tablas definidas`);
    } else {
      logger.info(`[DB] La base de datos "${db.name}" contiene ${tables.length} tablas.`);
    }

    logger.info('[DB] Validación de conexión y estructura completada correctamente.');
  } catch (error) {
    logger.error(`[DB] Error durante la validación de la base de datos: ${error.message}`);
  } finally {
    if (connection) {
      await connection.end();
      logger.info('[DB] Conexión temporal al servidor MySQL cerrada.');
    }
  }
}

// =========================================================
// Cierra el pool de conexiones
// =========================================================
async function closePool() {
  try {
    await pool.end();
    logger.info('[DB] Pool cerrado correctamente.');
  } catch (error) {
    logger.error('[DB] Error al cerrar el pool:', error.message);
  }
}

module.exports = { pool, validateConnectionBD, closePool };
