// // const { iniciarChatGemini, enviarMensajeGemini } = require('../services/gemini');

// // exports.iniciarChat = async (req, res) => {
// //   try {
// //     const { userId, simulacion } = req.body;
// //     const result = await iniciarChatGemini(userId, simulacion);
// //     res.json(result);
// //   } catch (err) {
// //     res.status(500).json({ error: err.message });
// //   }
// // };

// // exports.chatMensaje = async (req, res) => {
// //   try {
// //     const { userId, mensaje } = req.body;
// //     const respuesta = await enviarMensajeGemini(userId, mensaje);
// //     res.json({ ok: true, respuesta });
// //   } catch (err) {
// //     res.status(500).json({ error: err.message });
// //   }
// // };

// // const { iniciarChatGemini, enviarMensajeGemini } = require('./services/gemini.service');

// // // Datos iniciales
// // const simulacionInicial = {
// //   analisis: '',
// //   cambios_realizados: {},
// //   nueva_simulacion: {},
// //   recomendaciones: []
// // };

// // // Bloques de contexto
// // const bloquesContexto = [
// //   { tipo: 'cliente', data: { nombre: 'Sebastian', edad: 35, perfil: 'conservador' } },
// //   { tipo: 'problema', data: 'Invertir $35 millones a 6 meses' },
// //   { tipo: 'productos', data: ['CDT', 'Fondo de inversión', 'Cuenta de ahorro', 'Bonos del gobierno'] },
// //   { tipo: 'politicas', data: ['No inventar rentabilidades', 'No ofrecer productos no aprobados'] },
// //   { tipo: 'reglas', data: ['Responde como un cliente real', 'Mantente dentro de tu rol'] },
// // ];

// // // Iniciar chat
// // await iniciarChatGemini('user123', simulacionInicial, bloquesContexto);

// // // Enviar mensaje
// // const respuesta = await enviarMensajeGemini('user123', 'Haz un análisis de inversión con estos productos');
// // console.log(respuesta);

// const { iniciarChatGemini, enviarMensajeGemini } = require('../services/gemini.service');

// exports.iniciarChat = async (req, res) => {
//   try {
//     const { userId, simulacion, bloquesContexto } = req.body;

//     // Si no envían simulación o bloques, usamos valores por defecto
//     const simulacionInicial = simulacion || {
//       analisis: '',
//       cambios_realizados: {},
//       nueva_simulacion: {},
//       recomendaciones: [],
//     };

//     const contextos = bloquesContexto || [
//       { tipo: 'cliente', data: { nombre: 'Sebastian', edad: 35, perfil: 'conservador' } },
//       { tipo: 'problema', data: 'Invertir $35 millones a 6 meses' },
//       {
//         tipo: 'productos',
//         data: ['CDT', 'Fondo de inversión', 'Cuenta de ahorro', 'Bonos del gobierno'],
//       },
//       {
//         tipo: 'politicas',
//         data: ['No inventar rentabilidades', 'No ofrecer productos no aprobados'],
//       },
//       { tipo: 'reglas', data: ['Responde como un cliente real', 'Mantente dentro de tu rol'] },
//     ];

//     const result = await iniciarChatGemini(userId, simulacionInicial, contextos);
//     res.json(result);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// exports.chatMensaje = async (req, res) => {
//   try {
//     const { userId, mensaje } = req.body;

//     if (!userId || !mensaje) {
//       return res.status(400).json({ error: 'Se requiere userId y mensaje.' });
//     }

//     const respuesta = await enviarMensajeGemini(userId, mensaje);
//     res.json({ ok: true, respuesta });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

const {
  iniciarSimulacion,
  enviarMensajeSimulacion,
  obtenerEstadoSimulacion,
  finalizarSimulacion,
} = require('../services/gemini.service');

/**
 * POST /api/simulacion/iniciar
 * Inicia una nueva simulación con la configuración del frontend
 *
 * Body esperado:
 * {
 *   userId: "user123",
 *   configuracion: {
 *     producto: "cdt_digital" | "cuenta_ahorros" | "todos" | "captacion" | "colocacion" | etc.,
 *     modo: "aprendizaje" | "evaluativo",
 *     destino: "personal" | "salon_sena",
 *     interaccion: "automatico" | "silenciado"
 *   }
 * }
 */
exports.iniciarSimulacion = async (req, res) => {
  try {
    const { userId, configuracion } = req.body;

    // Validaciones
    if (!userId) {
      return res.status(400).json({ error: 'Se requiere userId' });
    }

    if (!configuracion) {
      return res.status(400).json({ error: 'Se requiere configuración' });
    }

    const { producto, modo } = configuracion;

    if (!producto || !modo) {
      return res.status(400).json({
        error: 'La configuración debe incluir: producto y modo',
      });
    }

    // Validar valores permitidos
    const productosValidos = [
      'cuenta_ahorros',
      'cuenta_corriente',
      'cdt_digital',
      'credito_libre_inversion',
      'credito_educativo_educaplus',
      'credito_rotativo_empresarial',
      'todos',
      'captacion',
      'colocacion',
    ];

    const modosValidos = ['aprendizaje', 'evaluativo'];

    if (!productosValidos.includes(producto)) {
      return res.status(400).json({
        error: `Producto no válido. Opciones: ${productosValidos.join(', ')}`,
      });
    }

    if (!modosValidos.includes(modo)) {
      return res.status(400).json({
        error: `Modo no válido. Opciones: ${modosValidos.join(', ')}`,
      });
    }

    // Iniciar simulación
    const resultado = await iniciarSimulacion(userId, configuracion);

    res.json(resultado);
  } catch (err) {
    console.error('Error en iniciarSimulacion:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/simulacion/mensaje
 * Envía un mensaje del asesor (usuario) y recibe respuesta del cliente (IA)
 *
 * Body esperado:
 * {
 *   userId: "user123",
 *   mensaje: "Cordial saludo, señor Sebastián..."
 * }
 */
exports.enviarMensaje = async (req, res) => {
  try {
    const { userId, mensaje } = req.body;

    if (!userId || !mensaje) {
      return res.status(400).json({ error: 'Se requiere userId y mensaje' });
    }

    if (typeof mensaje !== 'string' || mensaje.trim().length === 0) {
      return res.status(400).json({ error: 'El mensaje debe ser un texto válido' });
    }

    const respuesta = await enviarMensajeSimulacion(userId, mensaje);
    res.json(respuesta);
  } catch (err) {
    console.error('Error en enviarMensaje:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/simulacion/estado/:userId
 * Obtiene el estado actual de la simulación
 */
exports.obtenerEstado = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Se requiere userId' });
    }

    const estado = obtenerEstadoSimulacion(userId);
    res.json(estado);
  } catch (err) {
    console.error('Error en obtenerEstado:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/simulacion/finalizar
 * Finaliza la simulación y devuelve un resumen
 *
 * Body esperado:
 * {
 *   userId: "user123"
 * }
 */
exports.finalizarSimulacion = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Se requiere userId' });
    }

    const resultado = finalizarSimulacion(userId);
    res.json(resultado);
  } catch (err) {
    console.error('Error en finalizarSimulacion:', err);
    res.status(500).json({ error: err.message });
  }
};
