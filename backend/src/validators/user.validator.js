const { pool } = require('../config/database.config');

async function validarAprendiz(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.userId;

    // ============ VALIDAR AUTENTICACIÓN ============
    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: 'Usuario no autenticado',
        mensaje: 'No se pudo obtener el ID del usuario del token',
      });
    }

    // ============ VALIDAR SI ES APRENDIZ ============
    const [aprendiz] = await pool.query(
      'SELECT id_aprendiz FROM aprendices WHERE id_aprendiz = ?',
      [userId]
    );

    if (!aprendiz || aprendiz.length === 0) {
      return res.status(403).json({
        ok: false,
        error: 'Acceso denegado',
        mensaje: 'El usuario no está registrado como aprendiz',
      });
    }
    // ✅ Todo validado, continuar al controlador
    next();
  } catch (err) {
    console.error('[Validación enviar mensaje] Error:', err);
    return res.status(500).json({
      ok: false,
      error: 'Error interno de validación',
      mensaje: err.message,
    });
  }
}

module.exports = {
  validarAprendiz,
};
