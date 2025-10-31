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

// const { genAI, geminiConfig } = require('../config/gemini.config');
// const productosBancarios = require('../data/productos-bancarios.json');
// const etapasChat = require('../data/etapas-chat.json');
// const POLITICAS_BANCO = require('../constants/politicasBanco.constants');

// // Guardamos sesiones por usuario
// const chatSessions = new Map();

// // Esquema JSON para la generación inicial de la simulación
// const JSON_SCHEMA_GENERACION_INICIAL = {
//   type: 'object',
//   properties: {
//     perfil_cliente: {
//       type: 'object',
//       properties: {
//         nombre: { type: 'string' },
//         edad: { type: 'number' },
//         ocupacion: { type: 'string' },
//         situacion_financiera: { type: 'string' },
//         objetivo_financiero: { type: 'string' },
//         perfil_riesgo: { type: 'string', enum: ['conservador', 'moderado', 'arriesgado'] },
//         monto_disponible: { type: 'number' },
//         plazo_deseado: { type: 'string' },
//         experiencia_productos: { type: 'string' },
//       },
//       required: ['nombre', 'edad', 'situacion_financiera', 'perfil_riesgo', 'monto_disponible'],
//     },
//     producto_foco: {
//       type: 'object',
//       properties: {
//         categoria: { type: 'string' },
//         nombre: { type: 'string' },
//         caracteristicas_clave: { type: 'array', items: { type: 'string' } },
//       },
//       required: ['categoria', 'nombre'],
//     },
//     recomendaciones_iniciales: {
//       type: 'array',
//       items: { type: 'string' },
//     },
//     mensaje_inicial_cliente: { type: 'string' },
//   },
//   required: ['perfil_cliente', 'producto_foco', 'mensaje_inicial_cliente'],
// };

// // Esquema JSON para respuestas de chat durante la simulación
// const JSON_SCHEMA_RESPUESTA_CHAT = {
//   type: 'object',
//   properties: {
//     etapa_actual: { type: 'number' },
//     nombre_etapa: { type: 'string' },
//     mensaje_cliente: { type: 'string' },
//     sugerencia_aprendizaje: { type: 'string' },
//     evaluacion_respuesta: {
//       type: 'object',
//       properties: {
//         aspectos_positivos: { type: 'array', items: { type: 'string' } },
//         aspectos_mejorables: { type: 'array', items: { type: 'string' } },
//         puntuacion: { type: 'number' },
//       },
//     },
//     puede_avanzar: { type: 'boolean' },
//     simulacion_completada: { type: 'boolean' },
//   },
//   required: [
//     'etapa_actual',
//     'nombre_etapa',
//     'mensaje_cliente',
//     'puede_avanzar',
//     'simulacion_completada',
//   ],
// };

// /**
//  * Genera el prompt inicial para crear el perfil del cliente y contexto
//  */
// function generarPromptInicial(configuracion) {
//   const { producto, modo, interaccion } = configuracion;

//   let instruccionProducto = '';
//   if (producto === 'todos') {
//     instruccionProducto = 'Elige aleatoriamente cualquier producto bancario.';
//   } else if (producto === 'captacion') {
//     instruccionProducto =
//       'Elige aleatoriamente un producto de captación (cuenta de ahorros, cuenta corriente o CDT digital).';
//   } else if (producto === 'colocacion') {
//     instruccionProducto =
//       'Elige aleatoriamente un producto de colocación (crédito de libre inversión, crédito educativo o crédito rotativo empresarial).';
//   } else {
//     instruccionProducto = `El producto foco de la simulación es: ${producto}.`;
//   }

//   return `Eres un generador de escenarios de simulación para entrenamiento de asesores bancarios.

// CONTEXTO DE PRODUCTOS BANCARIOS:
// ${JSON.stringify(productosBancarios, null, 2)}

// INSTRUCCIONES:
// ${instruccionProducto}

// Genera un perfil de cliente REALISTA y VARIADO con las siguientes características:
// 1. Nombre, edad y ocupación coherentes
// 2. Una situación financiera específica que justifique la visita al banco
// 3. Un monto disponible realista según la situación
// 4. Un objetivo financiero claro (invertir, solicitar crédito, etc.)
// 5. Un perfil de riesgo definido (conservador, moderado o arriesgado)
// 6. Experiencia previa con productos financieros

// El perfil debe ser coherente con el producto seleccionado.

// Genera también:
// - El primer mensaje que dirá el cliente al asesor (debe ser un saludo natural y presentación)
// ${modo === 'aprendizaje' ? '- Entre 3 y 5 recomendaciones iniciales para el asesor sobre cómo manejar este cliente y producto' : ''}

// Sé creativo y varía los escenarios para que cada simulación sea diferente.`;
// }

// /**
//  * Genera el prompt para las respuestas del chat según la etapa
//  */
// function generarPromptChat(configuracion, perfilCliente, productoFoco, mensajeAsesor, etapaActual) {
//   const etapa = etapasChat.etapas.find((e) => e.id === etapaActual);
//   const { modo } = configuracion;

//   let contextoEtapa = `
// ETAPA ACTUAL: ${etapa.nombre.toUpperCase()} (${etapa.id}/7)
// OBJETIVO: ${etapa.objetivo}
// QUIEN INICIA: ${etapa.quien_inicia}
// `;

//   if (etapa.validaciones) {
//     contextoEtapa += `\nVALIDACIONES REQUERIDAS:\n${etapa.validaciones.map((v) => `- ${v}`).join('\n')}`;
//   }

//   let instruccionesIA = `Eres un cliente bancario en una simulación de entrenamiento.

// PERFIL DEL CLIENTE:
// ${JSON.stringify(perfilCliente, null, 2)}

// PRODUCTO EN FOCO:
// ${JSON.stringify(productoFoco, null, 2)}

// ${contextoEtapa}

// ÚLTIMO MENSAJE DEL ASESOR:
// "${mensajeAsesor}"

// INSTRUCCIONES:
// 1. Responde como el cliente según tu perfil y la etapa actual
// 2. Mantente en el rol y coherente con tu personalidad
// 3. ${etapa.quien_inicia === 'cliente' ? 'Si es tu turno de hablar, genera tu mensaje.' : 'Responde apropiadamente al mensaje del asesor.'}
// 4. Sé realista: haz preguntas pertinentes, expresa dudas naturales, pide aclaraciones
// 5. No reveles toda la información de golpe, deja que el asesor pregunte
// 6. Evalúa la respuesta del asesor según las validaciones de la etapa

// ${
//   modo === 'aprendizaje'
//     ? `7. Genera una sugerencia de aprendizaje específica basada en:
//    - Lo que el asesor hizo bien o mal
//    - Lo que debería hacer a continuación
//    - Cómo puede mejorar su enfoque`
//     : ''
// }

// ${
//   modo === 'evaluativo'
//     ? `7. Evalúa la respuesta del asesor:
//    - Aspectos positivos (qué hizo bien)
//    - Aspectos mejorables (qué puede mejorar)
//    - Puntuación de 1 a 10`
//     : ''
// }

// 8. Determina si el asesor cumplió con los objetivos de esta etapa para poder avanzar
// 9. Si es la última etapa (7) y se cumplió el objetivo, marca simulacion_completada como true
// `;

//   return instruccionesIA;
// }

// /**
//  * Inicializa una nueva simulación
//  */
// async function iniciarSimulacion(userId, configuracion) {
//   try {
//     // Crear modelo para generación inicial
//     const modeloInicial = genAI.getGenerativeModel({
//       model: geminiConfig.model,
//       generationConfig: {
//         temperature: 0.8, // Mayor creatividad para generar escenarios variados
//         maxOutputTokens: geminiConfig.maxOutputTokens,
//         responseMimeType: 'application/json',
//         responseSchema: JSON_SCHEMA_GENERACION_INICIAL,
//       },
//     });

//     const promptInicial = generarPromptInicial(configuracion);
//     const resultado = await modeloInicial.generateContent(promptInicial);
//     const datosIniciales = JSON.parse(resultado.response.text());

//     // Crear modelo para el chat de simulación
//     const modeloChat = genAI.getGenerativeModel({
//       model: geminiConfig.model,
//       generationConfig: {
//         temperature: geminiConfig.temperature,
//         maxOutputTokens: geminiConfig.maxOutputTokens,
//         responseMimeType: 'application/json',
//         responseSchema: JSON_SCHEMA_RESPUESTA_CHAT,
//       },
//     });

//     // Iniciar chat con historial vacío
//     const chat = modeloChat.startChat({
//       history: [],
//     });

//     // Guardar sesión
//     chatSessions.set(userId, {
//       chat,
//       configuracion,
//       perfilCliente: datosIniciales.perfil_cliente,
//       productoFoco: datosIniciales.producto_foco,
//       recomendacionesIniciales: datosIniciales.recomendaciones_iniciales || [],
//       etapaActual: 1,
//       historialMensajes: [],
//       datosIniciales,
//     });

//     return {
//       ok: true,
//       datos: {
//         perfil_cliente: datosIniciales.perfil_cliente,
//         producto_foco: datosIniciales.producto_foco,
//         recomendaciones_iniciales: datosIniciales.recomendaciones_iniciales || [],
//         mensaje_inicial_cliente: datosIniciales.mensaje_inicial_cliente,
//         etapa_actual: 1,
//         nombre_etapa: 'saludo',
//       },
//     };
//   } catch (error) {
//     console.error('Error al iniciar simulación:', error);
//     throw new Error(`Error al iniciar simulación: ${error.message}`);
//   }
// }

// /**
//  * Envía un mensaje del asesor y obtiene respuesta del cliente
//  */
// async function enviarMensajeSimulacion(userId, mensajeAsesor) {
//   if (!chatSessions.has(userId)) {
//     throw new Error('No hay una simulación activa. Debes iniciar la simulación primero.');
//   }

//   const session = chatSessions.get(userId);
//   const { chat, configuracion, perfilCliente, productoFoco, etapaActual, historialMensajes } =
//     session;

//   try {
//     // Generar prompt contextual
//     const promptChat = generarPromptChat(
//       configuracion,
//       perfilCliente,
//       productoFoco,
//       mensajeAsesor,
//       etapaActual
//     );

//     // Enviar mensaje
//     const resultado = await chat.sendMessage(promptChat);
//     const respuesta = JSON.parse(resultado.response.text());

//     // Guardar en historial
//     historialMensajes.push({
//       rol: 'asesor',
//       mensaje: mensajeAsesor,
//       timestamp: new Date().toISOString(),
//     });

//     historialMensajes.push({
//       rol: 'cliente',
//       mensaje: respuesta.mensaje_cliente,
//       etapa: respuesta.etapa_actual,
//       timestamp: new Date().toISOString(),
//     });

//     // Actualizar etapa si puede avanzar
//     if (respuesta.puede_avanzar && respuesta.etapa_actual < 7) {
//       session.etapaActual = respuesta.etapa_actual + 1;
//     } else {
//       session.etapaActual = respuesta.etapa_actual;
//     }

//     // Actualizar sesión
//     chatSessions.set(userId, session);

//     return {
//       ok: true,
//       mensaje_cliente: respuesta.mensaje_cliente,
//       etapa_actual: session.etapaActual,
//       nombre_etapa: respuesta.nombre_etapa,
//       sugerencia_aprendizaje: respuesta.sugerencia_aprendizaje || null,
//       evaluacion: respuesta.evaluacion_respuesta || null,
//       puede_avanzar: respuesta.puede_avanzar,
//       simulacion_completada: respuesta.simulacion_completada || false,
//       progreso: `${respuesta.etapa_actual}/7`,
//     };
//   } catch (error) {
//     console.error('Error al enviar mensaje:', error);
//     throw new Error(`Error al enviar mensaje: ${error.message}`);
//   }
// }

// /**
//  * Obtiene el estado actual de una simulación
//  */
// function obtenerEstadoSimulacion(userId) {
//   if (!chatSessions.has(userId)) {
//     return { ok: false, message: 'No hay simulación activa' };
//   }

//   const session = chatSessions.get(userId);
//   const etapaInfo = etapasChat.etapas.find((e) => e.id === session.etapaActual);

//   return {
//     ok: true,
//     perfil_cliente: session.perfilCliente,
//     producto_foco: session.productoFoco,
//     etapa_actual: session.etapaActual,
//     nombre_etapa: etapaInfo?.nombre || '',
//     objetivo_etapa: etapaInfo?.objetivo || '',
//     historial: session.historialMensajes,
//     progreso: `${session.etapaActual}/7`,
//   };
// }

// /**
//  * Finaliza y limpia una simulación
//  */
// function finalizarSimulacion(userId) {
//   if (!chatSessions.has(userId)) {
//     return { ok: false, message: 'No hay simulación activa' };
//   }

//   const session = chatSessions.get(userId);
//   const resumen = {
//     perfil_cliente: session.perfilCliente,
//     producto_foco: session.productoFoco,
//     etapas_completadas: session.etapaActual,
//     total_mensajes: session.historialMensajes.length,
//     historial_completo: session.historialMensajes,
//   };

//   chatSessions.delete(userId);

//   return {
//     ok: true,
//     message: 'Simulación finalizada',
//     resumen,
//   };
// }

// module.exports = {
//   iniciarSimulacion,
//   enviarMensajeSimulacion,
//   obtenerEstadoSimulacion,
//   finalizarSimulacion,
// };

// import { GenerativeAIClient } from '@google/generative-ai'; // ejemplo de cliente
// import dotenv from 'dotenv';
// dotenv.config();

// const client = new GenerativeAIClient({ apiKey: process.env.GOOGLE_API_KEY });

// async function chatSimulador(userId, simulacionInicial, userMessages) {
//   // simulacionInicial: objeto JSON de la simulación previa
//   // userMessages: array de strings, los mensajes del usuario que quieres mandar ahora

//   const contents = [
//     {
//       role: 'system',
//       parts: [
//         {
//           text: 'Eres un asesor financiero bancario llamado Asistente SimulaBank. Usa el contexto de simulación para responder.',
//         },
//       ],
//     },
//     {
//       role: 'user',
//       parts: [{ text: `Simulación inicial: ${JSON.stringify(simulacionInicial)}` }],
//     },
//     // luego todos los mensajes del usuario:
//     ...userMessages.map((msg) => ({
//       role: 'user',
//       parts: [{ text: msg }],
//     })),
//   ];

//   const schema = {
//     type: 'object',
//     properties: {
//       analisis: { type: 'string' },
//       nuevo_monto: { type: 'number' },
//       nuevo_plazo: { type: 'integer' },
//       cuota_mensual_estimada: { type: 'number' },
//       riesgo: { type: 'string', enum: ['bajo', 'medio', 'alto'] },
//       recomendaciones: { type: 'array', items: { type: 'string' } },
//     },
//     required: ['analisis', 'cuota_mensual_estimada', 'riesgo'],
//   };

//   const response = await client.models.generateContent({
//     model: 'gemini-2.5-flash',
//     contents: contents,
//     generationConfig: {
//       response_mime_type: 'application/json',
//       response_schema: schema,
//     },
//   });

//   const respuestaJson = response.candidates[0].content; // dependiendo de SDK
//   return JSON.parse(respuestaJson);
// }

// const geminiService = {
//   async iniciarSimulacion(datos) {
//     // Lógica para iniciar la simulación
//   },
//   async enviarMensaje(mensaje) {
//     // Lógica para enviar un mensaje
//   },
//   async obtenerEstado() {
//     // Lógica para obtener el estado de la simulación
//   },
//   async finalizarSimulacion() {
//     // Lógica para finalizar la simulación
//   },
// };

// module.exports = geminiService;

const { genAI, geminiConfig } = require('../config/gemini.config');
const POLITICAS_BANCO = require('../constants/politicasBanco.constants');
const PRODUCTOS_FINANCIEROS = require('../constants/productosFinancieros.constants');
const TIPOS_CLIENTES = require('../constants/tiposClientes.constants');
const PERFILES_CLIENTES = require('../constants/perfilesClientes.constants');
const ETAPAS_PRODUCTOS = require('../constants/etapas.constants');

// Almacén temporal de simulaciones activas (en producción usa Redis o base de datos)
const simulacionesActivas = new Map();

// ============= FUNCIONES AUXILIARES =============

function generarPerfilPorProducto(nombreProducto) {
  const perfilesRelacionados = Object.entries(PERFILES_CLIENTES)
    .filter(([, perfil]) =>
      perfil.productos.some((p) => p.toLowerCase().includes(nombreProducto.toLowerCase()))
    )
    .map(([nombre, perfil]) => ({ nombre, ...perfil }));

  if (perfilesRelacionados.length === 0)
    throw new Error(`No se encontró un perfil relacionado con el producto: "${nombreProducto}"`);

  return perfilesRelacionados[Math.floor(Math.random() * perfilesRelacionados.length)];
}

async function generarEscenarioCliente(nombreProducto) {
  const producto = PRODUCTOS_FINANCIEROS[nombreProducto];
  if (!producto) throw new Error(`Producto financiero no encontrado: ${nombreProducto}`);

  const tipoCliente = TIPOS_CLIENTES[Math.floor(Math.random() * TIPOS_CLIENTES.length)];
  const perfilCliente = generarPerfilPorProducto(nombreProducto);

  const prompt = `
    Eres un generador de escenarios de clientes bancarios simulados.
    Devuelve únicamente un objeto JSON con los campos solicitados.

    Contexto del banco:
    ${JSON.stringify(POLITICAS_BANCO, null, 2)}

    Producto:
    ${JSON.stringify(producto, null, 2)}

    Tipo de cliente:
    ${JSON.stringify(tipoCliente, null, 2)}

    Perfil:
    ${JSON.stringify(perfilCliente, null, 2)}

    Crea un cliente ficticio coherente con este producto y perfil.
    Incluye nombre, edad, profesión, situacion_actual, motivación, nivel_conocimiento, perfil_riesgo, objetivo y escenario_narrativo.
  `;

  const schema = {
    type: 'object',
    properties: {
      nombre: { type: 'string' },
      edad: { type: 'integer' },
      profesion: { type: 'string' },
      situacion_actual: { type: 'string' },
      motivacion: { type: 'string' },
      nivel_conocimiento: { type: 'string' },
      perfil_riesgo: { type: 'string', enum: ['Conservador', 'Moderado', 'Agresivo'] },
      objetivo: { type: 'string' },
      escenario_narrativo: { type: 'string' },
    },
    required: [
      'nombre',
      'edad',
      'profesion',
      'situacion_actual',
      'motivacion',
      'nivel_conocimiento',
      'perfil_riesgo',
      'objetivo',
      'escenario_narrativo',
    ],
  };

  // Usar la sintaxis correcta de @google/genai
  const response = await genAI.models.generateContent({
    model: geminiConfig.model,
    contents: prompt,
    config: {
      temperature: geminiConfig.temperature,
      maxOutputTokens: geminiConfig.maxOutputTokens,
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  });

  return JSON.parse(response.text);
}

async function generarMensajeCliente(etapa, cliente, producto, historialConversacion = []) {
  const historialTexto = historialConversacion.map((m) => `${m.rol}: ${m.mensaje}`).join('\n');

  const prompt = `
Eres el cliente ${cliente.nombre}, ${cliente.profesion}, de ${cliente.edad} años.
Producto de interés: ${producto}.
Etapa actual: ${etapa.nombre} (${etapa.objetivo})

${historialTexto ? `Conversación previa:\n${historialTexto}\n` : ''}

Genera un mensaje inicial natural del cliente, breve y realista para esta etapa.
Mantén coherencia con la conversación previa.
`;

  // Usar la sintaxis correcta de @google/genai
  const response = await genAI.models.generateContent({
    model: geminiConfig.model,
    contents: prompt,
    config: {
      temperature: 0.8,
      maxOutputTokens: 150,
    },
  });

  return response.text.trim();
}

async function obtenerRespuestaCliente(
  nombreProducto,
  cliente,
  etapa,
  mensajeAsesor,
  historialConversacion = []
) {
  const historialTexto = historialConversacion.map((m) => `${m.rol}: ${m.mensaje}`).join('\n');

  const prompt = `
Eres el cliente ${cliente.nombre}, ${cliente.profesion}, de ${cliente.edad} años.
Estás interesado en el producto "${nombreProducto}".
Etapa actual: ${etapa.nombre} (${etapa.objetivo}).

${historialTexto ? `Conversación previa:\n${historialTexto}\n` : ''}

El asesor te dijo: "${mensajeAsesor}"

Responde como cliente real, de forma natural y breve.
Si el mensaje del asesor no está relacionado con el contexto financiero o el producto, responde:
"Lo siento, parece que te has salido del tema de la asesoría. La simulación ha finalizado."
`;

  // Usar la sintaxis correcta de @google/genai
  const response = await genAI.models.generateContent({
    model: geminiConfig.model,
    contents: prompt,
    config: {
      temperature: 0.8,
      maxOutputTokens: 150,
    },
  });

  return response.text.trim() || 'Sin respuesta del cliente.';
}

// ============= FUNCIONES PRINCIPALES =============

/**
 * Inicia una nueva simulación
 * @param {string} userId - ID del usuario
 * @param {object} configuracion - { producto, modo, destino, interaccion }
 */
async function iniciarSimulacion(userId, configuracion) {
  const { producto } = configuracion;

  // Mapear nombres de productos del frontend a los de ETAPAS_PRODUCTOS
  const mapaProductos = {
    cuenta_ahorros: 'Cuenta de Ahorros',
    cuenta_corriente: 'Cuenta Corriente',
    cdt_digital: 'CDT Digital',
    credito_libre_inversion: 'Crédito de Libre Inversión',
    credito_educativo_educaplus: 'Crédito Educativo EducaPlus',
    credito_rotativo_empresarial: 'Crédito Rotativo Empresarial',
  };

  const nombreProducto = mapaProductos[producto];
  if (!nombreProducto) {
    throw new Error(`Producto no soportado: ${producto}`);
  }

  // Generar cliente y obtener etapas
  const cliente = await generarEscenarioCliente(nombreProducto);
  const etapas = ETAPAS_PRODUCTOS[nombreProducto];

  if (!etapas || etapas.length === 0) {
    throw new Error(`No existen etapas definidas para el producto: ${nombreProducto}`);
  }

  // Crear objeto de simulación
  const simulacion = {
    userId,
    configuracion,
    nombreProducto,
    cliente,
    etapas,
    etapaActualIndex: 0,
    historialConversacion: [],
    estado: 'esperando_asesor', // 'esperando_asesor' | 'esperando_cliente' | 'finalizada'
    iniciadaEn: new Date(),
  };

  // Determinar primer mensaje según quién inicia
  const primeraEtapa = etapas[0];

  if (primeraEtapa.quien_inicia === 'cliente') {
    // El cliente inicia, generamos su mensaje
    const mensajeCliente = await generarMensajeCliente(primeraEtapa, cliente, nombreProducto);

    simulacion.historialConversacion.push({
      etapaId: primeraEtapa.id,
      rol: 'cliente',
      mensaje: mensajeCliente,
      timestamp: new Date(),
    });

    simulacion.estado = 'esperando_asesor';
    simulacion.ultimoMensajeCliente = mensajeCliente;
  } else {
    // El asesor debe iniciar
    simulacion.estado = 'esperando_asesor';
    simulacion.ultimoMensajeCliente = null;
  }

  // Guardar simulación
  simulacionesActivas.set(userId, simulacion);

  return {
    ok: true,
    cliente: {
      nombre: cliente.nombre,
      edad: cliente.edad,
      profesion: cliente.profesion,
      perfil_riesgo: cliente.perfil_riesgo,
      escenario_narrativo: cliente.escenario_narrativo,
    },
    etapaActual: {
      numero: 1,
      total: etapas.length,
      id: primeraEtapa.id,
      nombre: primeraEtapa.nombre,
      objetivo: primeraEtapa.objetivo,
      quien_inicia: primeraEtapa.quien_inicia,
    },
    estado: simulacion.estado,
    mensajeCliente: simulacion.ultimoMensajeCliente,
    mensaje:
      primeraEtapa.quien_inicia === 'cliente'
        ? 'El cliente ha iniciado la conversación'
        : 'El asesor debe iniciar esta etapa',
  };
}

/**
 * Envía un mensaje del asesor y obtiene respuesta del cliente
 * @param {string} userId - ID del usuario
 * @param {string} mensajeAsesor - Mensaje del asesor
 */
async function enviarMensajeSimulacion(userId, mensajeAsesor) {
  const simulacion = simulacionesActivas.get(userId);

  if (!simulacion) {
    throw new Error('No existe una simulación activa para este usuario');
  }

  if (simulacion.estado === 'finalizada') {
    throw new Error('La simulación ya ha finalizado');
  }

  if (simulacion.estado !== 'esperando_asesor') {
    throw new Error('No es el turno del asesor');
  }

  const etapaActual = simulacion.etapas[simulacion.etapaActualIndex];

  // Registrar mensaje del asesor
  simulacion.historialConversacion.push({
    etapaId: etapaActual.id,
    rol: 'asesor',
    mensaje: mensajeAsesor,
    timestamp: new Date(),
  });

  // Generar respuesta del cliente
  const respuestaCliente = await obtenerRespuestaCliente(
    simulacion.nombreProducto,
    simulacion.cliente,
    etapaActual,
    mensajeAsesor,
    simulacion.historialConversacion
  );

  // Registrar respuesta del cliente
  simulacion.historialConversacion.push({
    etapaId: etapaActual.id,
    rol: 'cliente',
    mensaje: respuestaCliente,
    timestamp: new Date(),
  });

  simulacion.ultimoMensajeCliente = respuestaCliente;

  // Verificar si la simulación debe finalizar
  if (
    respuestaCliente.includes('te has salido del tema') ||
    respuestaCliente.includes('simulación ha finalizado')
  ) {
    simulacion.estado = 'finalizada';
    return {
      ok: true,
      mensajeCliente: respuestaCliente,
      estado: 'finalizada',
      mensaje: 'La simulación ha finalizado por contexto inapropiado',
    };
  }

  // Avanzar a siguiente etapa si corresponde
  let avanzarEtapa = false;

  // Lógica simple: si es la última interacción esperada de esta etapa, avanzamos
  const mensajesEtapa = simulacion.historialConversacion.filter(
    (m) => m.etapaId === etapaActual.id
  );

  // Si hay al menos 2 intercambios (asesor-cliente), consideramos avanzar
  if (mensajesEtapa.length >= 2) {
    avanzarEtapa = true;
  }

  if (avanzarEtapa && simulacion.etapaActualIndex < simulacion.etapas.length - 1) {
    // Avanzar a la siguiente etapa
    simulacion.etapaActualIndex++;
    const nuevaEtapa = simulacion.etapas[simulacion.etapaActualIndex];

    // Si la nueva etapa la inicia el cliente, generamos su mensaje
    if (nuevaEtapa.quien_inicia === 'cliente') {
      const mensajeInicioCliente = await generarMensajeCliente(
        nuevaEtapa,
        simulacion.cliente,
        simulacion.nombreProducto,
        simulacion.historialConversacion
      );

      simulacion.historialConversacion.push({
        etapaId: nuevaEtapa.id,
        rol: 'cliente',
        mensaje: mensajeInicioCliente,
        timestamp: new Date(),
      });

      simulacion.ultimoMensajeCliente = mensajeInicioCliente;
    }

    simulacion.estado = 'esperando_asesor';

    return {
      ok: true,
      mensajeCliente: respuestaCliente,
      etapaCambiada: true,
      etapaActual: {
        numero: simulacion.etapaActualIndex + 1,
        total: simulacion.etapas.length,
        id: nuevaEtapa.id,
        nombre: nuevaEtapa.nombre,
        objetivo: nuevaEtapa.objetivo,
        quien_inicia: nuevaEtapa.quien_inicia,
      },
      mensajeNuevaEtapa:
        nuevaEtapa.quien_inicia === 'cliente' ? simulacion.ultimoMensajeCliente : null,
      estado: simulacion.estado,
    };
  }

  // Si es la última etapa y ya hubo interacción, finalizar
  if (simulacion.etapaActualIndex === simulacion.etapas.length - 1 && avanzarEtapa) {
    simulacion.estado = 'finalizada';
    return {
      ok: true,
      mensajeCliente: respuestaCliente,
      estado: 'finalizada',
      mensaje: 'Simulación completada exitosamente',
    };
  }

  // Continuar en la misma etapa
  simulacion.estado = 'esperando_asesor';

  return {
    ok: true,
    mensajeCliente: respuestaCliente,
    etapaCambiada: false,
    etapaActual: {
      numero: simulacion.etapaActualIndex + 1,
      total: simulacion.etapas.length,
      id: etapaActual.id,
      nombre: etapaActual.nombre,
      objetivo: etapaActual.objetivo,
      quien_inicia: etapaActual.quien_inicia,
    },
    estado: simulacion.estado,
  };
}

/**
 * Obtiene el estado actual de la simulación
 */
function obtenerEstadoSimulacion(userId) {
  const simulacion = simulacionesActivas.get(userId);

  if (!simulacion) {
    return {
      ok: false,
      mensaje: 'No existe una simulación activa para este usuario',
    };
  }

  const etapaActual = simulacion.etapas[simulacion.etapaActualIndex];

  return {
    ok: true,
    estado: simulacion.estado,
    cliente: {
      nombre: simulacion.cliente.nombre,
      edad: simulacion.cliente.edad,
      profesion: simulacion.cliente.profesion,
    },
    etapaActual: {
      numero: simulacion.etapaActualIndex + 1,
      total: simulacion.etapas.length,
      id: etapaActual.id,
      nombre: etapaActual.nombre,
      objetivo: etapaActual.objetivo,
      quien_inicia: etapaActual.quien_inicia,
    },
    historialConversacion: simulacion.historialConversacion,
    ultimoMensajeCliente: simulacion.ultimoMensajeCliente,
  };
}

/**
 * Finaliza la simulación y devuelve resumen
 */
function finalizarSimulacion(userId) {
  const simulacion = simulacionesActivas.get(userId);

  if (!simulacion) {
    throw new Error('No existe una simulación activa para este usuario');
  }

  simulacion.estado = 'finalizada';
  simulacion.finalizadaEn = new Date();

  const resumen = {
    ok: true,
    mensaje: 'Simulación finalizada',
    duracion: Math.floor((simulacion.finalizadaEn - simulacion.iniciadaEn) / 1000), // segundos
    etapasCompletadas: simulacion.etapaActualIndex + 1,
    totalEtapas: simulacion.etapas.length,
    mensajesIntercambiados: simulacion.historialConversacion.length,
    historial: simulacion.historialConversacion,
  };

  // Eliminar simulación del almacén temporal
  simulacionesActivas.delete(userId);

  return resumen;
}

module.exports = {
  iniciarSimulacion,
  enviarMensajeSimulacion,
  obtenerEstadoSimulacion,
  finalizarSimulacion,
};
