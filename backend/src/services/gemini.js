// const { genAI, geminiConfig } = require('../config/gemini.config');

// // Guardamos sesiones por usuario
// const chatSessions = new Map();

// // Esquema JSON esperado para simulaciones
// const JSON_SCHEMA_SIMULACION = {
//   type: 'object',
//   properties: {
//     analisis: { type: 'string' },
//     cambios_realizados: { type: 'object' },
//     nueva_simulacion: { type: 'object' },
//     recomendaciones: {
//       type: 'array',
//       items: { type: 'string' },
//     },
//   },
//   required: ['analisis', 'recomendaciones'],
// };

// // Crea el modelo generativo configurado para respuesta JSON
// function crearModeloJSON() {
//   return genAI.getGenerativeModel({
//     model: geminiConfig.model,
//     generationConfig: {
//       temperature: geminiConfig.temperature,
//       maxOutputTokens: geminiConfig.maxOutputTokens,
//       response_mime_type: 'application/json',
//       response_schema: JSON_SCHEMA_SIMULACION,
//     },
//   });
// }

// // Inicializa chat con simulación y bloques de contexto
// async function iniciarChatGemini(userId, simulacionInicial, bloquesContexto = []) {
//   const chatModel = crearModeloJSON();
//   const chat = chatModel.startChat({
//     history: [
//       // Cada bloque de contexto como mensaje system
//       ...bloquesContexto.map((bloque) => ({
//         role: 'system',
//         parts: [{ text: JSON.stringify(bloque) }],
//       })),
//       {
//         role: 'user',
//         parts: [
//           {
//             text: `Iniciar simulación con estos datos JSON:\n${JSON.stringify(simulacionInicial)}`,
//           },
//         ],
//       },
//     ],
//   });

//   chatSessions.set(userId, {
//     chat,
//     simulacionBase: simulacionInicial,
//   });

//   return { ok: true, message: 'Chat iniciado con simulación inicial estructurada.' };
// }

// // Enviar mensaje a Gemini y actualizar simulación
// async function enviarMensajeGemini(userId, mensaje) {
//   if (!chatSessions.has(userId)) {
//     throw new Error('No hay una sesión activa. Debes iniciar el chat primero.');
//   }

//   const session = chatSessions.get(userId);
//   const result = await session.chat.sendMessage(mensaje);
//   const respuestaJSON = JSON.parse(result.response.text());

//   // Actualizar simulación si la respuesta contiene cambios
//   if (respuestaJSON.nueva_simulacion) {
//     session.simulacionBase = respuestaJSON.nueva_simulacion;
//   }

//   return respuestaJSON;
// }

// module.exports = {
//   iniciarChatGemini,
//   enviarMensajeGemini,
// };

const { genAI, geminiConfig } = require('../config/gemini.config');
const productosBancarios = require('../data/productos-bancarios.json');
const etapasChat = require('../data/etapas-chat.json');

// Guardamos sesiones por usuario
const chatSessions = new Map();

// Esquema JSON para la generación inicial de la simulación
const JSON_SCHEMA_GENERACION_INICIAL = {
  type: 'object',
  properties: {
    perfil_cliente: {
      type: 'object',
      properties: {
        nombre: { type: 'string' },
        edad: { type: 'number' },
        ocupacion: { type: 'string' },
        situacion_financiera: { type: 'string' },
        objetivo_financiero: { type: 'string' },
        perfil_riesgo: { type: 'string', enum: ['conservador', 'moderado', 'arriesgado'] },
        monto_disponible: { type: 'number' },
        plazo_deseado: { type: 'string' },
        experiencia_productos: { type: 'string' },
      },
      required: ['nombre', 'edad', 'situacion_financiera', 'perfil_riesgo', 'monto_disponible'],
    },
    producto_foco: {
      type: 'object',
      properties: {
        categoria: { type: 'string' },
        nombre: { type: 'string' },
        caracteristicas_clave: { type: 'array', items: { type: 'string' } },
      },
      required: ['categoria', 'nombre'],
    },
    recomendaciones_iniciales: {
      type: 'array',
      items: { type: 'string' },
    },
    mensaje_inicial_cliente: { type: 'string' },
  },
  required: ['perfil_cliente', 'producto_foco', 'mensaje_inicial_cliente'],
};

// Esquema JSON para respuestas de chat durante la simulación
const JSON_SCHEMA_RESPUESTA_CHAT = {
  type: 'object',
  properties: {
    etapa_actual: { type: 'number' },
    nombre_etapa: { type: 'string' },
    mensaje_cliente: { type: 'string' },
    sugerencia_aprendizaje: { type: 'string' },
    evaluacion_respuesta: {
      type: 'object',
      properties: {
        aspectos_positivos: { type: 'array', items: { type: 'string' } },
        aspectos_mejorables: { type: 'array', items: { type: 'string' } },
        puntuacion: { type: 'number' },
      },
    },
    puede_avanzar: { type: 'boolean' },
    simulacion_completada: { type: 'boolean' },
  },
  required: [
    'etapa_actual',
    'nombre_etapa',
    'mensaje_cliente',
    'puede_avanzar',
    'simulacion_completada',
  ],
};

/**
 * Genera el prompt inicial para crear el perfil del cliente y contexto
 */
function generarPromptInicial(configuracion) {
  const { producto, modo, interaccion } = configuracion;

  let instruccionProducto = '';
  if (producto === 'todos') {
    instruccionProducto = 'Elige aleatoriamente cualquier producto bancario.';
  } else if (producto === 'captacion') {
    instruccionProducto =
      'Elige aleatoriamente un producto de captación (cuenta de ahorros, cuenta corriente o CDT digital).';
  } else if (producto === 'colocacion') {
    instruccionProducto =
      'Elige aleatoriamente un producto de colocación (crédito de libre inversión, crédito educativo o crédito rotativo empresarial).';
  } else {
    instruccionProducto = `El producto foco de la simulación es: ${producto}.`;
  }

  return `Eres un generador de escenarios de simulación para entrenamiento de asesores bancarios.

CONTEXTO DE PRODUCTOS BANCARIOS:
${JSON.stringify(productosBancarios, null, 2)}

INSTRUCCIONES:
${instruccionProducto}

Genera un perfil de cliente REALISTA y VARIADO con las siguientes características:
1. Nombre, edad y ocupación coherentes
2. Una situación financiera específica que justifique la visita al banco
3. Un monto disponible realista según la situación
4. Un objetivo financiero claro (invertir, solicitar crédito, etc.)
5. Un perfil de riesgo definido (conservador, moderado o arriesgado)
6. Experiencia previa con productos financieros

El perfil debe ser coherente con el producto seleccionado.

Genera también:
- El primer mensaje que dirá el cliente al asesor (debe ser un saludo natural y presentación)
${modo === 'aprendizaje' ? '- Entre 3 y 5 recomendaciones iniciales para el asesor sobre cómo manejar este cliente y producto' : ''}

Sé creativo y varía los escenarios para que cada simulación sea diferente.`;
}

/**
 * Genera el prompt para las respuestas del chat según la etapa
 */
function generarPromptChat(configuracion, perfilCliente, productoFoco, mensajeAsesor, etapaActual) {
  const etapa = etapasChat.etapas.find((e) => e.id === etapaActual);
  const { modo } = configuracion;

  let contextoEtapa = `
ETAPA ACTUAL: ${etapa.nombre.toUpperCase()} (${etapa.id}/7)
OBJETIVO: ${etapa.objetivo}
QUIEN INICIA: ${etapa.quien_inicia}
`;

  if (etapa.validaciones) {
    contextoEtapa += `\nVALIDACIONES REQUERIDAS:\n${etapa.validaciones.map((v) => `- ${v}`).join('\n')}`;
  }

  let instruccionesIA = `Eres un cliente bancario en una simulación de entrenamiento.

PERFIL DEL CLIENTE:
${JSON.stringify(perfilCliente, null, 2)}

PRODUCTO EN FOCO:
${JSON.stringify(productoFoco, null, 2)}

${contextoEtapa}

ÚLTIMO MENSAJE DEL ASESOR:
"${mensajeAsesor}"

INSTRUCCIONES:
1. Responde como el cliente según tu perfil y la etapa actual
2. Mantente en el rol y coherente con tu personalidad
3. ${etapa.quien_inicia === 'cliente' ? 'Si es tu turno de hablar, genera tu mensaje.' : 'Responde apropiadamente al mensaje del asesor.'}
4. Sé realista: haz preguntas pertinentes, expresa dudas naturales, pide aclaraciones
5. No reveles toda la información de golpe, deja que el asesor pregunte
6. Evalúa la respuesta del asesor según las validaciones de la etapa

${
  modo === 'aprendizaje'
    ? `7. Genera una sugerencia de aprendizaje específica basada en:
   - Lo que el asesor hizo bien o mal
   - Lo que debería hacer a continuación
   - Cómo puede mejorar su enfoque`
    : ''
}

${
  modo === 'evaluativo'
    ? `7. Evalúa la respuesta del asesor:
   - Aspectos positivos (qué hizo bien)
   - Aspectos mejorables (qué puede mejorar)
   - Puntuación de 1 a 10`
    : ''
}

8. Determina si el asesor cumplió con los objetivos de esta etapa para poder avanzar
9. Si es la última etapa (7) y se cumplió el objetivo, marca simulacion_completada como true
`;

  return instruccionesIA;
}

/**
 * Inicializa una nueva simulación
 */
async function iniciarSimulacion(userId, configuracion) {
  try {
    // Crear modelo para generación inicial
    const modeloInicial = genAI.getGenerativeModel({
      model: geminiConfig.model,
      generationConfig: {
        temperature: 0.8, // Mayor creatividad para generar escenarios variados
        maxOutputTokens: geminiConfig.maxOutputTokens,
        responseMimeType: 'application/json',
        responseSchema: JSON_SCHEMA_GENERACION_INICIAL,
      },
    });

    const promptInicial = generarPromptInicial(configuracion);
    const resultado = await modeloInicial.generateContent(promptInicial);
    const datosIniciales = JSON.parse(resultado.response.text());

    // Crear modelo para el chat de simulación
    const modeloChat = genAI.getGenerativeModel({
      model: geminiConfig.model,
      generationConfig: {
        temperature: geminiConfig.temperature,
        maxOutputTokens: geminiConfig.maxOutputTokens,
        responseMimeType: 'application/json',
        responseSchema: JSON_SCHEMA_RESPUESTA_CHAT,
      },
    });

    // Iniciar chat con historial vacío
    const chat = modeloChat.startChat({
      history: [],
    });

    // Guardar sesión
    chatSessions.set(userId, {
      chat,
      configuracion,
      perfilCliente: datosIniciales.perfil_cliente,
      productoFoco: datosIniciales.producto_foco,
      recomendacionesIniciales: datosIniciales.recomendaciones_iniciales || [],
      etapaActual: 1,
      historialMensajes: [],
      datosIniciales,
    });

    return {
      ok: true,
      datos: {
        perfil_cliente: datosIniciales.perfil_cliente,
        producto_foco: datosIniciales.producto_foco,
        recomendaciones_iniciales: datosIniciales.recomendaciones_iniciales || [],
        mensaje_inicial_cliente: datosIniciales.mensaje_inicial_cliente,
        etapa_actual: 1,
        nombre_etapa: 'saludo',
      },
    };
  } catch (error) {
    console.error('Error al iniciar simulación:', error);
    throw new Error(`Error al iniciar simulación: ${error.message}`);
  }
}

/**
 * Envía un mensaje del asesor y obtiene respuesta del cliente
 */
async function enviarMensajeSimulacion(userId, mensajeAsesor) {
  if (!chatSessions.has(userId)) {
    throw new Error('No hay una simulación activa. Debes iniciar la simulación primero.');
  }

  const session = chatSessions.get(userId);
  const { chat, configuracion, perfilCliente, productoFoco, etapaActual, historialMensajes } =
    session;

  try {
    // Generar prompt contextual
    const promptChat = generarPromptChat(
      configuracion,
      perfilCliente,
      productoFoco,
      mensajeAsesor,
      etapaActual
    );

    // Enviar mensaje
    const resultado = await chat.sendMessage(promptChat);
    const respuesta = JSON.parse(resultado.response.text());

    // Guardar en historial
    historialMensajes.push({
      rol: 'asesor',
      mensaje: mensajeAsesor,
      timestamp: new Date().toISOString(),
    });

    historialMensajes.push({
      rol: 'cliente',
      mensaje: respuesta.mensaje_cliente,
      etapa: respuesta.etapa_actual,
      timestamp: new Date().toISOString(),
    });

    // Actualizar etapa si puede avanzar
    if (respuesta.puede_avanzar && respuesta.etapa_actual < 7) {
      session.etapaActual = respuesta.etapa_actual + 1;
    } else {
      session.etapaActual = respuesta.etapa_actual;
    }

    // Actualizar sesión
    chatSessions.set(userId, session);

    return {
      ok: true,
      mensaje_cliente: respuesta.mensaje_cliente,
      etapa_actual: session.etapaActual,
      nombre_etapa: respuesta.nombre_etapa,
      sugerencia_aprendizaje: respuesta.sugerencia_aprendizaje || null,
      evaluacion: respuesta.evaluacion_respuesta || null,
      puede_avanzar: respuesta.puede_avanzar,
      simulacion_completada: respuesta.simulacion_completada || false,
      progreso: `${respuesta.etapa_actual}/7`,
    };
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    throw new Error(`Error al enviar mensaje: ${error.message}`);
  }
}

/**
 * Obtiene el estado actual de una simulación
 */
function obtenerEstadoSimulacion(userId) {
  if (!chatSessions.has(userId)) {
    return { ok: false, message: 'No hay simulación activa' };
  }

  const session = chatSessions.get(userId);
  const etapaInfo = etapasChat.etapas.find((e) => e.id === session.etapaActual);

  return {
    ok: true,
    perfil_cliente: session.perfilCliente,
    producto_foco: session.productoFoco,
    etapa_actual: session.etapaActual,
    nombre_etapa: etapaInfo?.nombre || '',
    objetivo_etapa: etapaInfo?.objetivo || '',
    historial: session.historialMensajes,
    progreso: `${session.etapaActual}/7`,
  };
}

/**
 * Finaliza y limpia una simulación
 */
function finalizarSimulacion(userId) {
  if (!chatSessions.has(userId)) {
    return { ok: false, message: 'No hay simulación activa' };
  }

  const session = chatSessions.get(userId);
  const resumen = {
    perfil_cliente: session.perfilCliente,
    producto_foco: session.productoFoco,
    etapas_completadas: session.etapaActual,
    total_mensajes: session.historialMensajes.length,
    historial_completo: session.historialMensajes,
  };

  chatSessions.delete(userId);

  return {
    ok: true,
    message: 'Simulación finalizada',
    resumen,
  };
}

module.exports = {
  iniciarSimulacion,
  enviarMensajeSimulacion,
  obtenerEstadoSimulacion,
  finalizarSimulacion,
};
