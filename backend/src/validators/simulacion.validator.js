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
const DESTINOS_VALIDOS = ['personal', 'sala'];
const INTERACCIONES_VALIDAS = ['automatico', 'silenciado'];

/**
 * Middleware que valida la solicitud de iniciar simulación.
 * Valida los datos Y hace el mapeo del producto.
 * El controlador recibe datos ya procesados y listos para usar.
 */
async function validarDatosDeIniciarSimulacion(req, res, next) {
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

async function validarDatosDeEnviarMensaje(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { mensaje } = req.body;

    // ============ VALIDAR AUTENTICACIÓN ============
    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: 'Usuario no autenticado',
        mensaje: 'Debe iniciar sesión para enviar mensajes.',
      });
    }

    // ============ VALIDAR EXISTENCIA DEL USUARIO COMO APRENDIZ ============
    const [aprendiz] = await pool.query(
      'SELECT id_aprendiz FROM aprendices WHERE id_aprendiz = ?',
      [userId]
    );

    if (!aprendiz || aprendiz.length === 0) {
      return res.status(403).json({
        ok: false,
        error: 'Acceso denegado',
        mensaje: 'El usuario autenticado no está registrado como aprendiz.',
      });
    }

    // ============ VALIDAR ESTRUCTURA DEL BODY ============
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        ok: false,
        error: 'Cuerpo de solicitud inválido',
        mensaje: 'Debe enviar un objeto JSON con el campo "mensaje".',
      });
    }

    // ============ VALIDAR CAMPO "mensaje" ============
    if (mensaje === undefined || mensaje === null) {
      return res.status(400).json({
        ok: false,
        error: 'Mensaje requerido',
        mensaje: 'Debe enviar el campo "mensaje" en la solicitud.',
      });
    }

    if (typeof mensaje !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Tipo de dato incorrecto',
        mensaje: 'El campo "mensaje" debe ser una cadena de texto.',
      });
    }

    const mensajeLimpio = mensaje.trim();

    if (mensajeLimpio.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'Mensaje vacío',
        mensaje: 'El mensaje no puede estar vacío o solo contener espacios.',
      });
    }

    // ============ VALIDAR LONGITUD Y CONTENIDO ============
    if (mensajeLimpio.length > 1000) {
      return res.status(400).json({
        ok: false,
        error: 'Mensaje demasiado largo',
        mensaje: 'El mensaje no puede superar los 1000 caracteres.',
      });
    }

    // Evitar mensajes con solo símbolos o números
    if (!/[a-zA-ZÀ-ÿ]/.test(mensajeLimpio)) {
      return res.status(400).json({
        ok: false,
        error: 'Contenido inválido',
        mensaje: 'El mensaje debe contener al menos una palabra o carácter alfabético válido.',
      });
    }

    // Sanitizar el mensaje (para evitar espacios repetidos y caracteres no deseados)
    req.body.mensaje = mensajeLimpio.replace(/\s+/g, ' ');

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

async function validarUsuario(req, res, next) {
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
  validarDatosDeIniciarSimulacion,
  validarDatosDeEnviarMensaje,
  validarUsuario,
};
