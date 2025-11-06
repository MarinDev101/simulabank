const { pool } = require('../config/database.config');

// 🗺️ Mapa de conversión: clave del frontend → nombre en BD
const MAPA_PRODUCTOS = {
  cuenta_ahorros: 'Cuenta de Ahorros',
  cuenta_corriente: 'Cuenta Corriente',
  cdt_digital: 'CDT Digital',
  credito_libre_inversion: 'Crédito de Libre Inversión',
  credito_educativo_educaplus: 'Crédito Educativo EducaPlus',
  credito_rotativo_empresarial: 'Crédito Rotativo Empresarial',
};

const PRODUCTOS_VALIDOS = Object.keys(MAPA_PRODUCTOS);
const MODOS_VALIDOS = ['aprendizaje', 'evaluativo'];
const DESTINOS_VALIDOS = ['personal', 'salon_sena'];
const INTERACCIONES_VALIDAS = ['automatico', 'silenciado'];

/**
 * Middleware que valida la solicitud de iniciar simulación.
 * Valida los datos Y hace el mapeo del producto.
 * El controlador recibe datos ya procesados y listos para usar.
 */
async function validarIniciarSimulacion(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { configuracion } = req.body;

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

    // ============ VALIDAR CONFIGURACIÓN ============
    if (!configuracion) {
      return res.status(400).json({
        ok: false,
        error: 'Configuración requerida',
        mensaje: 'Debe enviar un objeto configuracion con producto y modo',
      });
    }

    const { producto, modo, destino = 'personal', interaccion = 'automatico' } = configuracion;

    // Validar campos requeridos
    if (!producto || !modo) {
      return res.status(400).json({
        ok: false,
        error: 'Configuración incompleta',
        mensaje: 'La configuración debe incluir: producto y modo',
      });
    }

    // ============ VALIDAR Y MAPEAR PRODUCTO ============
    if (!PRODUCTOS_VALIDOS.includes(producto)) {
      return res.status(400).json({
        ok: false,
        error: 'Producto no válido',
        mensaje: `Opciones válidas: ${PRODUCTOS_VALIDOS.join(', ')}`,
        productoRecibido: producto,
      });
    }

    // ✅ MAPEAR el producto a su nombre en BD
    const nombreProducto = MAPA_PRODUCTOS[producto];

    // Agregar el nombre mapeado a la configuración para el controlador
    req.body.configuracion.nombreProducto = nombreProducto;

    // ============ VALIDAR MODO ============
    if (!MODOS_VALIDOS.includes(modo)) {
      return res.status(400).json({
        ok: false,
        error: 'Modo no válido',
        mensaje: `Opciones válidas: ${MODOS_VALIDOS.join(', ')}`,
        modoRecibido: modo,
      });
    }

    // ============ VALIDAR DESTINO ============
    if (destino && !DESTINOS_VALIDOS.includes(destino)) {
      return res.status(400).json({
        ok: false,
        error: 'Destino no válido',
        mensaje: `Opciones válidas: ${DESTINOS_VALIDOS.join(', ')}`,
        destinoRecibido: destino,
      });
    }

    // ============ VALIDAR INTERACCIÓN ============
    if (interaccion && !INTERACCIONES_VALIDAS.includes(interaccion)) {
      return res.status(400).json({
        ok: false,
        error: 'Interacción no válida',
        mensaje: `Opciones válidas: ${INTERACCIONES_VALIDAS.join(', ')}`,
        interaccionRecibida: interaccion,
      });
    }

    // ✅ Todo validado y mapeado, continuar al controlador
    next();
  } catch (err) {
    console.error('[Validación simulación] Error:', err);
    return res.status(500).json({
      ok: false,
      error: 'Error interno de validación',
      mensaje: err.message,
    });
  }
}

module.exports = {
  validarIniciarSimulacion,
};
