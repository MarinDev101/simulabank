const { pool } = require('../config/database.config');
const bcrypt = require('bcryptjs');

class VerificacionService {
  /**
   * Guardar código de verificación para REGISTRO
   * Invalida códigos anteriores del mismo correo y tipo antes de crear uno nuevo
   */
  async guardarCodigoVerificacion(correo, nombres, apellidos, contrasena) {
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(contrasena, 10);
    // Usar 15 minutos de expiración y formato UTC para evitar problemas de zona horaria
    const expiracionMinutos = 15;

    // Invalidar códigos anteriores del mismo correo y tipo (registro)
    await pool.query(
      `UPDATE codigos_verificacion SET usado = 1 WHERE correo_electronico = ? AND tipo = 'registro' AND usado = 0`,
      [correo]
    );

    // Insertar nuevo código
    await pool.query(
      `INSERT INTO codigos_verificacion
       (correo_electronico, codigo, nombres, apellidos, contrasena_hash, tipo, fecha_expiracion)
       VALUES (?, ?, ?, ?, ?, 'registro', DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE))`,
      [correo, codigo, nombres, apellidos, hashedPassword, expiracionMinutos]
    );

    return codigo;
  }

  /**
   * Guardar código de verificación para RECUPERACIÓN DE CONTRASEÑA
   * Invalida códigos anteriores del mismo correo y tipo antes de crear uno nuevo
   */
  async guardarCodigoRecuperacion(correo) {
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    // Usar 15 minutos de expiración y formato UTC para evitar problemas de zona horaria
    const expiracionMinutos = 15;

    // Invalidar códigos anteriores del mismo correo y tipo (recuperacion)
    await pool.query(
      `UPDATE codigos_verificacion SET usado = 1 WHERE correo_electronico = ? AND tipo = 'recuperacion' AND usado = 0`,
      [correo]
    );

    // Insertar nuevo código
    await pool.query(
      `INSERT INTO codigos_verificacion
       (correo_electronico, codigo, tipo, fecha_expiracion)
       VALUES (?, ?, 'recuperacion', DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE))`,
      [correo, codigo, expiracionMinutos]
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
       AND fecha_expiracion > UTC_TIMESTAMP()
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
       AND fecha_expiracion > UTC_TIMESTAMP()
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
