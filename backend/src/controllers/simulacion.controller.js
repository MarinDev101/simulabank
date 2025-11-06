// const geminiService = require('../services/gemini');
// const logger = require('../utils/logger');
// const { pool } = require('../config/database.config');
// /**
//  * POST /api/simulacion/iniciar
//  * Inicia una nueva simulación con la configuración del frontend
//  *
//  * Body esperado:
//  * {
//  *   configuracion: {
//  *     producto: "cdt_digital" | "cuenta_ahorros" | "cuenta_corriente" | etc.,
//  *     modo: "aprendizaje" | "evaluativo",
//  *     destino: "personal" | "salon_sena",
//  *     interaccion: "automatico" | "silenciado"
//  *   }
//  * }
//  *
//  * El userId se obtiene del token JWT (req.user.id)
//  */
// exports.iniciarSimulacion = async (req, res) => {
//   try {
//     const userId = req.user?.id || req.user?.userId;
//     const { configuracion } = req.body;

//     // ============ VERIFICAR SI YA TIENE UNA SIMULACIÓN EN PROCESO ============
//     const simulacionExistente = await simulacionModel.obtenerSimulacionEnProceso(userId);

//     if (simulacionExistente) {
//       return res.status(409).json({
//         ok: false,
//         error: 'Simulación en proceso',
//         mensaje: 'Ya tienes una simulación en curso. Finalízala antes de iniciar una nueva.',
//         simulacionActual: {
//           producto: simulacionExistente.productoNombre,
//           etapaActual: simulacionExistente.etapaActualIndex + 1,
//           estado: simulacionExistente.estado,
//         },
//       });
//     }

//     // ============ OBTENER DATOS DE BD ============
//     const nombreProducto = MAPA_PRODUCTOS[producto];
//     const productoInfo = await simulacionModel.obtenerProductoPorNombre(nombreProducto);

//     if (!productoInfo) {
//       return res.status(404).json({
//         ok: false,
//         error: 'Producto no encontrado',
//         mensaje: `No se encontró el producto: ${nombreProducto}`,
//       });
//     }

//     const tipoCliente = await simulacionModel.obtenerTipoClienteAleatorio();
//     const perfilCliente = await simulacionModel.obtenerPerfilPorProducto(
//       productoInfo.id_producto_bancario
//     );
//     const etapas = await simulacionModel.obtenerEtapasProducto(productoInfo.id_producto_bancario);

//     if (etapas.length === 0) {
//       return res.status(500).json({
//         ok: false,
//         error: 'Etapas no definidas',
//         mensaje: `No existen etapas definidas para el producto: ${nombreProducto}`,
//       });
//     }

//     // ============ GENERAR PERFIL DEL CLIENTE CON IA ============
//     logger.info(`[Simulación] Generando perfil de cliente para producto: ${nombreProducto}`);

//     const cliente = await geminiService.generarPerfilCliente(
//       productoInfo,
//       tipoCliente,
//       perfilCliente
//     );

//     // ============ DETERMINAR PRIMER MENSAJE ============
//     const primeraEtapa = etapas[0];
//     let historialConversacion = [];
//     let estadoInicial = 'en_proceso'; // El estado debe ser uno de los valores permitidos: 'en_proceso', 'finalizada' o 'pausada'
//     let ultimoMensajeCliente = null;

//     if (primeraEtapa.quien_inicia === 'cliente') {
//       logger.info('[Simulación] El cliente inicia la conversación');

//       const mensajeCliente = await geminiService.generarMensajeInicialCliente(
//         primeraEtapa,
//         cliente,
//         nombreProducto
//       );

//       historialConversacion.push({
//         etapaId: primeraEtapa.id,
//         rol: 'cliente',
//         mensaje: mensajeCliente,
//         timestamp: new Date(),
//       });

//       ultimoMensajeCliente = mensajeCliente;
//     }

//     // ============ GUARDAR EN BASE DE DATOS ============
//     logger.info('[Simulación] Guardando simulación en base de datos');
//     logger.info('[Debug] User data:', { user: req.user, userId });

//     const idSimulacion = await simulacionModel.crearSimulacion({
//       idAprendiz: userId,
//       idProductoBancario: productoInfo.id_producto_bancario,
//       idTipoCliente: tipoCliente.id_tipo_cliente,
//       idPerfilCliente: perfilCliente.id_perfil_cliente,
//       configuracion: {
//         producto,
//         modo,
//         destino,
//         interaccion,
//       },
//       cliente,
//       etapaActualIndex: 0,
//       historialConversacion,
//       estado: estadoInicial,
//       ultimoMensajeCliente,
//     });

//     logger.info(`[Simulación] Simulación iniciada exitosamente. ID: ${idSimulacion}`);

//     // ============ RESPUESTA ============
//     res.json({
//       ok: true,
//       mensaje:
//         primeraEtapa.quien_inicia === 'cliente'
//           ? 'El cliente ha iniciado la conversación'
//           : 'El asesor debe iniciar esta etapa',
//       cliente: {
//         nombre: cliente.nombre,
//         edad: cliente.edad,
//         profesion: cliente.profesion,
//         perfil_riesgo: cliente.perfil_riesgo,
//         escenario_narrativo: cliente.escenario_narrativo,
//       },
//       etapaActual: {
//         numero: 1,
//         total: etapas.length,
//         id: primeraEtapa.id,
//         nombre: primeraEtapa.nombre,
//         objetivo: primeraEtapa.objetivo,
//         quien_inicia: primeraEtapa.quien_inicia,
//         validaciones: primeraEtapa.validaciones,
//         sugerencias: primeraEtapa.sugerencias_aprendizaje,
//       },
//       estado: estadoInicial,
//       mensajeCliente: ultimoMensajeCliente,
//     });
//   } catch (err) {
//     logger.error('[Simulación] Error al iniciar:', err);

//     res.status(500).json({
//       ok: false,
//       error: 'Error al iniciar simulación',
//       mensaje: err.message,
//     });
//   }
// };

const { pool } = require('../config/database.config');
const geminiService = require('../services/gemini');

// http://localhost:3000/api/simulacion/iniciar

/**
 * http://localhost:3000/api/simulacion/iniciar
 * {
  "configuracion": {
    "producto": "cuenta_ahorros",
    "modo": "aprendizaje",
    "destino": "personal",
    "interaccion": "automatico"
  }
}
 * El controlador recibe datos ya procesados y listos para usar.
 */
exports.iniciarSimulacion = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { configuracion } = req.body;

    // ✅ El validador ya verificó:
    // - userId existe y es un aprendiz
    // - configuración es válida
    // - producto está mapeado a nombreProducto

    const nombreProducto = configuracion.nombreProducto; // Ya viene mapeado del validador

    // =====================================================
    // 1️⃣ Verificar si ya hay una simulación activa o pausada
    // =====================================================
    const [simulacionExistente] = await pool.query(
      `SELECT id_simulacion, estado
       FROM simulaciones
       WHERE id_aprendiz = ?
       AND estado IN ('en_proceso', 'pausada')
       LIMIT 1`,
      [userId]
    );

    if (simulacionExistente.length > 0) {
      const simulacion = simulacionExistente[0];
      return res.status(409).json({
        ok: false,
        error: 'Simulación existente',
        mensaje: `Ya tienes una simulación ${simulacion.estado === 'en_proceso' ? 'en proceso' : 'pausada'}. Debes finalizarla antes de iniciar una nueva.`,
        simulacion_existente: simulacion,
      });
    }

    // =====================================================
    // 2️⃣ Obtener información del producto bancario por nombre
    // =====================================================
    const [productos] = await pool.query('SELECT * FROM productos_bancarios WHERE nombre = ?', [
      nombreProducto,
    ]);

    const producto = productos[0] || null;

    if (!producto) {
      return res.status(404).json({
        ok: false,
        error: 'Producto no encontrado',
        mensaje: `No se encontró un producto bancario con el nombre "${nombreProducto}" en la base de datos.`,
      });
    }

    // =====================================================
    // 3️⃣ Obtener un tipo de cliente aleatorio
    // =====================================================
    const [tiposClientes] = await pool.query(
      'SELECT * FROM tipos_clientes ORDER BY RAND() LIMIT 1'
    );

    const tipoClienteAleatorio = tiposClientes[0] || null;

    if (!tipoClienteAleatorio) {
      return res.status(404).json({
        ok: false,
        error: 'Tipo de cliente no encontrado',
        mensaje: 'No se encontró ningún tipo de cliente en la base de datos.',
      });
    }

    // =====================================================
    // 4️⃣ Obtener un perfil de cliente asociado al producto (aleatorio)
    // =====================================================
    const [perfilesAsociados] = await pool.query(
      `SELECT pc.*
       FROM perfiles_clientes pc
       INNER JOIN perfiles_productos pp ON pc.id_perfil_cliente = pp.id_perfil_cliente
       INNER JOIN productos_bancarios pb ON pb.id_producto_bancario = pp.id_producto_bancario
       WHERE pb.nombre = ?
       ORDER BY RAND()
       LIMIT 1`,
      [nombreProducto]
    );

    const perfilClienteAleatorio = perfilesAsociados[0] || null;

    if (!perfilClienteAleatorio) {
      return res.status(404).json({
        ok: false,
        error: 'Perfil no encontrado',
        mensaje: `No se encontró ningún perfil de cliente asociado al producto "${nombreProducto}".`,
      });
    }

    // =====================================================
    // 5️⃣ Generar escenario del cliente usando Gemini 🤖
    // =====================================================
    let escenarioCliente = null;
    try {
      escenarioCliente = await geminiService.generarEscenarioCliente(
        producto,
        tipoClienteAleatorio,
        perfilClienteAleatorio
      );
    } catch (error) {
      console.error('Error al generar el escenario con Gemini:', error);
      return res.status(500).json({
        ok: false,
        error: 'Error de IA',
        mensaje: 'Error al generar el escenario del cliente con Gemini.',
        detalle: error.message,
      });
    }

    // =====================================================
    // 6️⃣ Crear la nueva simulación
    // =====================================================
    const { modo, destino, interaccion } = configuracion;

    const [result] = await pool.query(
      `INSERT INTO simulaciones (
        id_aprendiz,
        id_producto_bancario,
        producto_seleccion,
        modo,
        destino_evidencia,
        sonido_habilitado,
        perfil_cliente,
        aspectos_clave_registrados,
        conversacion_asesoria,
        estado
      )
      VALUES (?, ?, 'especifico', ?, ?, ?, '{}', '[]', '[]', 'en_proceso')`,
      [userId, producto.id_producto_bancario, modo, destino, interaccion !== 'silenciado']
    );

    const idNuevaSimulacion = result.insertId;

    // =====================================================
    // 7️⃣ Guardar el CLIENTE SIMULADO (escenario generado)
    // =====================================================
    await pool.query(
      `INSERT INTO clientes_simulados (
        id_simulacion,
        nombre,
        edad,
        profesion,
        situacion_actual,
        motivacion,
        nivel_conocimiento,
        perfil_riesgo,
        objetivo,
        escenario_narrativo,
        id_tipo_cliente,
        id_perfil_cliente
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idNuevaSimulacion,
        escenarioCliente.nombre,
        escenarioCliente.edad,
        escenarioCliente.profesion,
        escenarioCliente.situacion_actual,
        escenarioCliente.motivacion,
        escenarioCliente.nivel_conocimiento,
        escenarioCliente.perfil_riesgo,
        escenarioCliente.objetivo,
        escenarioCliente.escenario_narrativo,
        tipoClienteAleatorio.id_tipo_cliente,
        perfilClienteAleatorio.id_perfil_cliente,
      ]
    );

    // =====================================================
    // 8️⃣ Respuesta completa al frontend
    // =====================================================
    return res.status(201).json({
      ok: true,
      mensaje: 'Simulación iniciada correctamente.',
      id_simulacion: idNuevaSimulacion,
      producto,
      tipo_cliente: tipoClienteAleatorio,
      perfil_cliente: perfilClienteAleatorio,
      escenario_cliente: escenarioCliente,
    });
  } catch (error) {
    console.error('Error al iniciar simulación:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno',
      mensaje: 'Error interno al iniciar la simulación.',
      detalle: error.message,
    });
  }
};

// /**
//  * POST /api/simulacion/mensaje
//  * Envía un mensaje del asesor (usuario) y recibe respuesta del cliente (IA)
//  *
//  * Body esperado:
//  * {
//  *   mensaje: "Cordial saludo, señor Sebastián..."
//  * }
//  *
//  * El userId se obtiene del token JWT (req.user.id)
//  */
// exports.enviarMensaje = async (req, res) => {
//   try {
//     // El userId viene del middleware authenticateJWT
//     const userId = req.user?.id || req.user?.userId;
//     const { mensaje } = req.body;

//     if (!userId) {
//       return res.status(401).json({
//         error: 'Usuario no autenticado',
//         mensaje: 'No se pudo obtener el ID del usuario del token',
//       });
//     }

//     if (!mensaje) {
//       return res.status(400).json({
//         error: 'Se requiere mensaje',
//         mensaje: 'Debe enviar un campo "mensaje" con el texto del asesor',
//       });
//     }

//     if (typeof mensaje !== 'string' || mensaje.trim().length === 0) {
//       return res.status(400).json({
//         error: 'Mensaje inválido',
//         mensaje: 'El mensaje debe ser un texto válido no vacío',
//       });
//     }

//     const respuesta = await enviarMensajeSimulacion(userId, mensaje.trim());
//     res.json(respuesta);
//   } catch (err) {
//     console.error('Error en enviarMensaje:', err);

//     // Manejar errores específicos del servicio
//     if (err.message.includes('No existe una simulación activa')) {
//       return res.status(404).json({
//         error: 'Simulación no encontrada',
//         mensaje: 'No existe una simulación activa. Debe iniciar una primero.',
//         accion: 'Llame a POST /api/simulacion/iniciar',
//       });
//     }

//     if (err.message.includes('ya ha finalizado')) {
//       return res.status(400).json({
//         error: 'Simulación finalizada',
//         mensaje: 'Esta simulación ya ha terminado. Inicie una nueva.',
//         accion: 'Llame a POST /api/simulacion/iniciar',
//       });
//     }

//     if (err.message.includes('No es el turno del asesor')) {
//       return res.status(400).json({
//         error: 'Turno incorrecto',
//         mensaje: 'No es su turno para enviar mensajes',
//       });
//     }

//     res.status(500).json({
//       error: 'Error al procesar mensaje',
//       mensaje: err.message,
//     });
//   }
// };

// /**
//  * GET /api/simulacion/estado
//  * Obtiene el estado actual de la simulación del usuario autenticado
//  *
//  * El userId se obtiene del token JWT (req.user.id)
//  */
// exports.obtenerEstado = async (req, res) => {
//   try {
//     // El userId viene del middleware authenticateJWT
//     const userId = req.user?.id || req.user?.userId;

//     if (!userId) {
//       return res.status(401).json({
//         error: 'Usuario no autenticado',
//         mensaje: 'No se pudo obtener el ID del usuario del token',
//       });
//     }

//     const estado = obtenerEstadoSimulacion(userId);

//     // Si no hay simulación activa, devolver 404
//     if (!estado.ok) {
//       return res.status(404).json({
//         ok: false,
//         error: 'Simulación no encontrada',
//         mensaje: 'No existe una simulación activa para este usuario',
//         accion: 'Inicie una nueva simulación con POST /api/simulacion/iniciar',
//       });
//     }

//     res.json(estado);
//   } catch (err) {
//     console.error('Error en obtenerEstado:', err);
//     res.status(500).json({
//       error: 'Error al obtener estado',
//       mensaje: err.message,
//     });
//   }
// };

// /**
//  * POST /api/simulacion/finalizar
//  * Finaliza la simulación actual y devuelve un resumen
//  *
//  * El userId se obtiene del token JWT (req.user.id)
//  */
// exports.finalizarSimulacion = async (req, res) => {
//   try {
//     // El userId viene del middleware authenticateJWT
//     const userId = req.user?.id || req.user?.userId;

//     if (!userId) {
//       return res.status(401).json({
//         error: 'Usuario no autenticado',
//         mensaje: 'No se pudo obtener el ID del usuario del token',
//       });
//     }

//     const resultado = finalizarSimulacion(userId);
//     res.json(resultado);
//   } catch (err) {
//     console.error('Error en finalizarSimulacion:', err);

//     if (err.message.includes('No existe una simulación activa')) {
//       return res.status(404).json({
//         error: 'Simulación no encontrada',
//         mensaje: 'No existe una simulación activa para finalizar',
//       });
//     }

//     res.status(500).json({
//       error: 'Error al finalizar simulación',
//       mensaje: err.message,
//     });
//   }
// };
