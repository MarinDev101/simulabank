const crypto = require('crypto');
const { pool } = require('../config/database.config'); // conexión directa a la BD
const logger = require('../utils/logger');

// =========================================================
// Funciones auxiliares
// =========================================================
const parseExpireToSeconds = (val) => {
  if (!val) return null;
  if (typeof val === 'number') return val;

  const m = /^([0-9]+)\s*([smhd])?$/.exec(val);
  if (!m) return null;

  const n = parseInt(m[1], 10);
  const unit = m[2] || 's';
  switch (unit) {
    case 's':
      return n;
    case 'm':
      return n * 60;
    case 'h':
      return n * 60 * 60;
    case 'd':
      return n * 60 * 60 * 24;
    default:
      return n;
  }
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// =========================================================
// Servicio principal de manejo de tokens
// =========================================================

const tokenService = {
  // Guardar nuevo refresh token
  async saveRefreshToken(token, userId, expires, meta = {}) {
    if (!userId || !token) throw new Error('userId y token son requeridos');

    try {
      const tokenHash = hashToken(token);
      const userAgent = meta.userAgent || meta.user_agent || null;
      const ttl = parseExpireToSeconds(expires);

      await pool.query(
        `INSERT INTO sesiones_usuarios
         (id_usuario, token_sesion, user_agent, activa, fecha_inicio, fecha_ultimo_acceso)
         VALUES (?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           activa = VALUES(activa),
           fecha_ultimo_acceso = NOW()`,
        [userId, tokenHash, userAgent, true]
      );

      if (ttl) {
        // Opcional: podrías tener una tarea de limpieza por TTL
        // o un campo adicional para fecha_expiracion
      }

      logger.info(`Token de sesión guardado para usuario ${userId}`);
    } catch (err) {
      logger.error('Error guardando token en base de datos:', err);
      throw err;
    }
  },

  // Verificar si un refresh token es válido
  async isRefreshTokenValid(token) {
    if (!token) return false;
    try {
      const tokenHash = hashToken(token);
      const [rows] = await pool.query(
        'SELECT activa FROM sesiones_usuarios WHERE token_sesion = ? LIMIT 1',
        [tokenHash]
      );
      return rows.length > 0 && !!rows[0].activa;
    } catch (err) {
      logger.error('Error verificando token:', err);
      throw err;
    }
  },

  // Revocar un token específico
  async revokeRefreshToken(token) {
    if (!token) return;
    try {
      const tokenHash = hashToken(token);
      await pool.query(
        'UPDATE sesiones_usuarios SET activa = FALSE, fecha_cierre = NOW() WHERE token_sesion = ?',
        [tokenHash]
      );
      logger.info('Token revocado correctamente');
    } catch (err) {
      logger.error('Error revocando token:', err);
      throw err;
    }
  },

  // Revocar todos los tokens de un usuario
  async revokeAll(userId) {
    if (!userId) return;
    try {
      await pool.query(
        'UPDATE sesiones_usuarios SET activa = FALSE, fecha_cierre = NOW() WHERE id_usuario = ? AND activa = TRUE',
        [userId]
      );
      logger.info(`Todas las sesiones activas del usuario ${userId} fueron revocadas`);
    } catch (err) {
      logger.error('Error revocando todas las sesiones del usuario:', err);
      throw err;
    }
  },

  // Revocar por ID de sesión
  async revokeBySessionId(sessionId) {
    if (!sessionId) return;
    try {
      await pool.query(
        'UPDATE sesiones_usuarios SET activa = FALSE, fecha_cierre = NOW() WHERE id_sesion_usuario = ?',
        [sessionId]
      );
      logger.info(`Sesión ${sessionId} revocada correctamente`);
    } catch (err) {
      logger.error('Error revocando sesión por ID:', err);
      throw err;
    }
  },

  // Listar todas las sesiones activas e inactivas de un usuario
  async listSessions(userId) {
    if (!userId) return [];
    try {
      const [rows] = await pool.query(
        `SELECT
          id_sesion_usuario AS id,
          user_agent AS userAgent,
          activa,
          fecha_inicio AS createdAt,
          fecha_ultimo_acceso AS lastAccess,
          fecha_cierre AS closedAt
         FROM sesiones_usuarios
         WHERE id_usuario = ?
         ORDER BY fecha_inicio DESC`,
        [userId]
      );
      return rows.map((r) => ({
        id: r.id,
        userAgent: r.userAgent,
        activa: !!r.activa,
        createdAt: r.createdAt,
        lastAccess: r.lastAccess,
        closedAt: r.closedAt,
      }));
    } catch (err) {
      logger.error('Error listando sesiones:', err);
      throw err;
    }
  },
};

module.exports = tokenService;
