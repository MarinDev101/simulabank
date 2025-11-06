const { pool } = require('../config/database.config');
const bcrypt = require('bcryptjs');

class VerificacionService {
  // Generar código de 6 dígitos
  generarCodigo() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Guardar código de verificación temporal
  async guardarCodigoVerificacion(correo, nombres, apellidos, contrasena) {
    const codigo = this.generarCodigo();
    const contrasenaHash = await bcrypt.hash(contrasena, 10);
    const minutosExpiracion = parseInt(process.env.VERIFICATION_CODE_EXPIRY || '5');

    // Calcular fecha de expiración
    const fechaExpiracion = new Date();
    fechaExpiracion.setMinutes(fechaExpiracion.getMinutes() + minutosExpiracion);

    // Eliminar códigos antiguos del mismo correo
    await pool.query('DELETE FROM codigos_verificacion WHERE correo_electronico = ?', [correo]);

    // Insertar nuevo código
    const query = `
      INSERT INTO codigos_verificacion
      (correo_electronico, codigo, nombres, apellidos, contrasena_hash, fecha_expiracion)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await pool.query(query, [correo, codigo, nombres, apellidos, contrasenaHash, fechaExpiracion]);

    return codigo;
  }

  // Verificar código
  async verificarCodigo(correo, codigo) {
    const query = `
      SELECT * FROM codigos_verificacion
      WHERE correo_electronico = ?
      AND codigo = ?
      AND usado = FALSE
      AND fecha_expiracion > NOW()
      ORDER BY fecha_creacion DESC
      LIMIT 1
    `;

    const [rows] = await pool.query(query, [correo, codigo]);

    if (rows.length === 0) {
      // Incrementar intentos si existe el código pero es incorrecto
      await pool.query(
        `UPDATE codigos_verificacion
         SET intentos = intentos + 1
         WHERE correo_electronico = ? AND usado = FALSE`,
        [correo]
      );
      return null;
    }

    return rows[0];
  }

  // Marcar código como usado
  async marcarCodigoUsado(correo, codigo) {
    await pool.query(
      `UPDATE codigos_verificacion
       SET usado = TRUE
       WHERE correo_electronico = ? AND codigo = ?`,
      [correo, codigo]
    );
  }

  // Limpiar códigos expirados (ejecutar periódicamente)
  async limpiarCodigosExpirados() {
    await pool.query(
      'DELETE FROM codigos_verificacion WHERE fecha_expiracion < NOW() OR usado = TRUE'
    );
  }
}

module.exports = new VerificacionService();
