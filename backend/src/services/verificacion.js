const { pool } = require('../config/database.config');
const bcrypt = require('bcryptjs');

class VerificacionService {
  /**
   * Guardar código de verificación para REGISTRO
   */
  async guardarCodigoVerificacion(correo, nombres, apellidos, contrasena) {
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(contrasena, 10);
    const expiracion = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

    await pool.query(
      `INSERT INTO codigos_verificacion
       (correo_electronico, codigo, nombres, apellidos, contrasena_hash, tipo, fecha_expiracion)
       VALUES (?, ?, ?, ?, ?, 'registro', ?)
       ON DUPLICATE KEY UPDATE
       codigo = VALUES(codigo),
       nombres = VALUES(nombres),
       apellidos = VALUES(apellidos),
       contrasena_hash = VALUES(contrasena_hash),
       tipo = 'registro',
       fecha_expiracion = VALUES(fecha_expiracion),
       usado = 0,
       intentos = 0`,
      [correo, codigo, nombres, apellidos, hashedPassword, expiracion]
    );

    return codigo;
  }

  /**
   * Guardar código de verificación para RECUPERACIÓN DE CONTRASEÑA
   */
  async guardarCodigoRecuperacion(correo) {
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiracion = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

    await pool.query(
      `INSERT INTO codigos_verificacion
       (correo_electronico, codigo, tipo, fecha_expiracion)
       VALUES (?, ?, 'recuperacion', ?)
       ON DUPLICATE KEY UPDATE
       codigo = VALUES(codigo),
       tipo = 'recuperacion',
       fecha_expiracion = VALUES(fecha_expiracion),
       usado = 0,
       intentos = 0`,
      [correo, codigo, expiracion]
    );

    return codigo;
  }

  /**
   * Verificar código de REGISTRO
   */
  async verificarCodigo(correo, codigo) {
    const [result] = await pool.query(
      `SELECT * FROM codigos_verificacion
       WHERE correo_electronico = ?
       AND codigo = ?
       AND tipo = 'registro'
       AND usado = 0
       AND fecha_expiracion > NOW()
       LIMIT 1`,
      [correo, codigo]
    );

    if (result.length === 0) {
      return null;
    }

    return result[0];
  }

  /**
   * Verificar código de RECUPERACIÓN
   */
  async verificarCodigoRecuperacion(correo, codigo) {
    const [result] = await pool.query(
      `SELECT * FROM codigos_verificacion
       WHERE correo_electronico = ?
       AND codigo = ?
       AND tipo = 'recuperacion'
       AND usado = 0
       AND fecha_expiracion > NOW()
       LIMIT 1`,
      [correo, codigo]
    );

    if (result.length === 0) {
      return null;
    }

    return result[0];
  }

  /**
   * Marcar código como usado (aplica para ambos tipos)
   */
  async marcarCodigoUsado(correo, codigo) {
    await pool.query(
      'UPDATE codigos_verificacion SET usado = 1 WHERE correo_electronico = ? AND codigo = ?',
      [correo, codigo]
    );
  }

  /**
   * Incrementar intentos fallidos
   */
  async incrementarIntentos(correo, codigo) {
    await pool.query(
      'UPDATE codigos_verificacion SET intentos = intentos + 1 WHERE correo_electronico = ? AND codigo = ?',
      [correo, codigo]
    );
  }

  /**
   * Limpiar códigos expirados (mantenimiento)
   */
  async limpiarCodigosExpirados() {
    await pool.query(
      'DELETE FROM codigos_verificacion WHERE fecha_expiracion < NOW() OR usado = 1'
    );
  }
}

module.exports = new VerificacionService();
