const { pool } = require('../config/database.config');
const { TABLAS, CAMPOS_ID, ESTADOS } = require('../constants/informacion-database/auth.constants');

class AdminController {
  async obtenerAprendices(req, res) {
    try {
      const [aprendices] = await pool.query(
        `
        SELECT
          u.id_usuario as id,
          u.correo_electronico as correo,
          u.nombres,
          u.apellidos,
          u.foto_perfil,
          u.fecha_nacimiento,
          u.genero,
          u.estado,
          u.fecha_creacion,
          u.ultimo_acceso,
          u.fecha_actualizacion
        FROM ?? u
        INNER JOIN ?? a ON u.?? = a.??
        ORDER BY u.fecha_creacion DESC
      `,
        [TABLAS.USUARIOS, TABLAS.APRENDICES, CAMPOS_ID.USUARIO, CAMPOS_ID.APRENDIZ]
      );

      return res.json(aprendices);
    } catch (error) {
      console.error('Error al obtener aprendices:', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor al obtener aprendices',
      });
    }
  }

  async actualizarAprendiz(req, res) {
    const { id } = req.params;
    const { nombres, apellidos, correo, estado, fecha_nacimiento, genero } = req.body;

    console.log('=== ACTUALIZAR APRENDIZ ===');
    console.log('ID:', id);
    console.log('Datos recibidos:', {
      nombres,
      apellidos,
      correo,
      estado,
      fecha_nacimiento,
      genero,
    });

    try {
      // Verificar que el aprendiz existe
      const [aprendiz] = await pool.query(
        `SELECT 1 FROM usuarios u
       INNER JOIN aprendices a ON u.id_usuario = a.id_aprendiz
       WHERE u.id_usuario = ?`,
        [id]
      );

      console.log('Aprendiz encontrado:', aprendiz.length > 0);

      if (aprendiz.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Aprendiz no encontrado',
        });
      }

      // Construir query de actualización dinámicamente
      const updates = [];
      const values = [];

      if (nombres !== undefined) {
        updates.push('nombres = ?');
        values.push(nombres);
      }
      if (apellidos !== undefined) {
        updates.push('apellidos = ?');
        values.push(apellidos);
      }
      if (correo !== undefined) {
        updates.push('correo_electronico = ?');
        values.push(correo);
      }
      if (estado !== undefined) {
        updates.push('estado = ?');
        values.push(estado);
      }
      if (fecha_nacimiento !== undefined) {
        updates.push('fecha_nacimiento = ?');
        values.push(fecha_nacimiento);
      }
      if (genero !== undefined) {
        updates.push('genero = ?');
        values.push(genero);
      }

      // Siempre actualizar fecha_actualizacion
      updates.push('fecha_actualizacion = NOW()');

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No hay datos para actualizar',
        });
      }

      values.push(parseInt(id)); // Para el WHERE

      const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id_usuario = ?`;
      console.log('Query final:', query);
      console.log('Valores:', values);

      const [result] = await pool.query(query, values);

      console.log('Resultado de la actualización:', result);

      return res.json({
        success: true,
        message: 'Aprendiz actualizado correctamente',
      });
    } catch (error) {
      console.error('❌ ERROR en actualizarAprendiz:', error);
      console.error('Stack trace:', error.stack);
      console.error('Código de error SQL:', error.code);
      console.error('Número de error SQL:', error.errno);

      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor al actualizar aprendiz',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  async inhabilitarAprendiz(req, res) {
    const { id } = req.params;

    try {
      // Verificar que el aprendiz existe
      const [aprendiz] = await pool.query(
        `
        SELECT 1 FROM ?? u
        INNER JOIN ?? a ON u.?? = a.??
        WHERE u.?? = ?
      `,
        [
          TABLAS.USUARIOS,
          TABLAS.APRENDICES,
          CAMPOS_ID.USUARIO,
          CAMPOS_ID.APRENDIZ,
          CAMPOS_ID.USUARIO,
          id,
        ]
      );

      if (aprendiz.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Aprendiz no encontrado',
        });
      }

      await pool.query('UPDATE ?? SET estado = ?, fecha_actualizacion = NOW() WHERE ?? = ?', [
        TABLAS.USUARIOS,
        ESTADOS.INACTIVO,
        CAMPOS_ID.USUARIO,
        id,
      ]);

      return res.json({
        success: true,
        message: 'Aprendiz inhabilitado correctamente',
      });
    } catch (error) {
      console.error('Error al inhabilitar aprendiz:', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor al inhabilitar aprendiz',
      });
    }
  }

  async habilitarAprendiz(req, res) {
    const { id } = req.params;

    try {
      // Verificar que el aprendiz existe
      const [aprendiz] = await pool.query(
        `
        SELECT 1 FROM ?? u
        INNER JOIN ?? a ON u.?? = a.??
        WHERE u.?? = ?
      `,
        [
          TABLAS.USUARIOS,
          TABLAS.APRENDICES,
          CAMPOS_ID.USUARIO,
          CAMPOS_ID.APRENDIZ,
          CAMPOS_ID.USUARIO,
          id,
        ]
      );

      if (aprendiz.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Aprendiz no encontrado',
        });
      }

      await pool.query('UPDATE ?? SET estado = ?, fecha_actualizacion = NOW() WHERE ?? = ?', [
        TABLAS.USUARIOS,
        ESTADOS.ACTIVO,
        CAMPOS_ID.USUARIO,
        id,
      ]);

      return res.json({
        success: true,
        message: 'Aprendiz habilitado correctamente',
      });
    } catch (error) {
      console.error('Error al habilitar aprendiz:', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor al habilitar aprendiz',
      });
    }
  }
}

module.exports = new AdminController();
