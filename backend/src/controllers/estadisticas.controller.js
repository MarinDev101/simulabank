const { pool } = require('../config/database.config');

class EstadisticasController {
  // Lista todos los logros disponibles en la plataforma
  async listarLogros(req, res) {
    const [logros] = await pool.query(
      `SELECT id_logro, nombre, imagen, descripcion, condicion_tipo
       FROM logros
       ORDER BY id_logro ASC`
    );

    return res.status(200).json({
      ok: true,
      logros,
    });
  }

  // Lista los logros que tiene asignados el aprendiz autenticado
  async listarLogrosAprendiz(req, res) {
    const idAprendiz = req.user?.id || req.user?.userId;

    const [logrosAprendiz] = await pool.query(
      `SELECT l.id_logro, l.nombre, l.imagen, l.descripcion, l.condicion_tipo, al.fecha_desbloqueo
       FROM aprendices_logros al
       INNER JOIN logros l ON l.id_logro = al.id_logro
       WHERE al.id_aprendiz = ?
       ORDER BY al.fecha_desbloqueo ASC`,
      [idAprendiz]
    );

    return res.status(200).json({
      ok: true,
      logros: logrosAprendiz,
    });
  }

  // Información general de inicio
  async listarInformacionInicio(req, res) {
    try {
      const idAprendiz = req.user?.id || req.user?.userId;

      // Total de simulaciones completadas:
      // - estado = 'finalizada'
      // - tienen información en analisis_desempeno
      const [[{ total: totalSimulacionesCompletadas }]] = await pool.query(
        `SELECT COUNT(*) AS total
       FROM simulaciones
       WHERE id_aprendiz = ?
         AND estado = 'finalizada'
         AND analisis_desempeno IS NOT NULL
         AND analisis_desempeno <> ''`,
        [idAprendiz]
      );

      // Total de logros completados por el aprendiz
      const [[{ total: totalLogrosCompletados }]] = await pool.query(
        `SELECT COUNT(*) AS total
       FROM aprendices_logros
       WHERE id_aprendiz = ?`,
        [idAprendiz]
      );

      return res.status(200).json({
        ok: true,
        datos: {
          totalSimulacionesCompletadas,
          totalLogrosCompletados,
        },
      });
    } catch (error) {
      console.error('Error en listarInformacionInicio:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener información de inicio',
        detalle: error.message,
      });
    }
  }
}

module.exports = new EstadisticasController();
