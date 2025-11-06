// Importar configuracion necesaria
// const { genAI, geminiConfig, profilesConfig, safetySettings } = require('../config/gemini.config');
// const { pool } = require('../config/database.config');
// const { mapSimulacionToDb, mapDbToSimulacion } = require('../models/simulacion.model');
// const { TABLAS, CAMPOS_ID } = require('../constants/informacion-database/auth.constants');

// Importar constantes de informacion de simulacion
// const POLITICAS_BANCO = require('../constants/informacion-simulacion/politicasBanco.constants');
// const PRODUCTOS_BANCARIOS = require('../constants/informacion-simulacion/productosBancarios.constants');
// const TIPOS_CLIENTES = require('../constants/informacion-simulacion/tiposClientes.constants');
// const PERFILES_CLIENTES = require('../constants/informacion-simulacion/perfilesClientes.constants');
// const ETAPAS_PRODUCTOS = require('../constants/informacion-simulacion/etapasConversacion.constants');

// Importar Funciones de utilidad
// const {
//   obtenerProductoEspecifico,
//   obtenerTipoClienteAleatorio,
//   obtenerPerfilPorProducto,
// } = require('../utils/funciones-simulacion');

// async function generarEscenarioCliente(producto, tipo_cliente, perfil_cliente) {
//   const systemInstruction = `Eres un generador experto de perfiles de clientes bancarios realistas.
//   Debes crear perfiles coherentes, creíbles y detallados que reflejen situaciones reales.`;

//   const prompt = `
//   Crea un perfil completo de cliente ficticio para este contexto bancario:

//     CONTEXTO DEL BANCO:
//     ${JSON.stringify(POLITICAS_BANCO, null, 2)}

//     PRODUCTO DE INTERÉS:
//     ${JSON.stringify(producto, null, 2)}

//     TIPO DE CLIENTE:
//     ${JSON.stringify(tipo_cliente, null, 2)}

//     PERFIL ESPERADO:
//     ${JSON.stringify(perfil_cliente, null, 2)}

//     INSTRUCCIONES:
//     - Crea un cliente REALISTA que encaje naturalmente con este producto
//     - El perfil debe ser coherente en todos sus aspectos
//     - La edad, profesión y situación deben estar alineadas
//     - El nivel de conocimiento financiero debe corresponder con su perfil
//     - El escenario narrativo debe ser específico y motivante

//     Devuelve SOLO el JSON sin texto adicional.
//   `;

//   const contents = [
//     {
//       role: 'system',
//       parts: [{ text: systemInstruction }],
//     },
//     {
//       role: 'user',
//       parts: [{ text: prompt }],
//     },
//   ];

//   const schema = {
//     type: 'object',
//     properties: {
//       nombre: { type: 'string', description: 'Nombre completo realista' },
//       edad: { type: 'string', description: 'Edad coherente con el perfil' },
//       profesion: { type: 'string', description: 'Profesión específica' },
//       situacion_actual: { type: 'string', description: 'Situación financiera detallada' },
//       motivacion: { type: 'string', description: 'Motivación clara para el producto' },
//       nivel_conocimiento: { type: 'string', description: 'Bajo, Medio o Alto' },
//       perfil_riesgo: { type: 'string', description: 'Conservador, Moderado o Agresivo' },
//       objetivo: { type: 'string', description: 'Objetivo financiero específico' },
//       escenario_narrativo: { type: 'string', description: 'Historia de fondo del cliente' },
//     },
//     required: [
//       'nombre',
//       'edad',
//       'profesion',
//       'situacion_actual',
//       'motivacion',
//       'nivel_conocimiento',
//       'perfil_riesgo',
//       'objetivo',
//       'escenario_narrativo',
//     ],
//   };

//   const response = await genAI.models.generateContent({
//     model: geminiConfig.model,
//     safetySettings: safetySettings.STRICT,
//     contents: contents,
//     config: {
//       temperature: profilesConfig.CREATIVE.temperature,
//       maxOutputTokens: profilesConfig.CREATIVE.maxOutputTokens,
//       topP: profilesConfig.CREATIVE.topP,
//       topK: profilesConfig.CREATIVE.topK,
//       responseMimeType: 'application/json',
//       responseSchema: schema,
//     },
//   });

//   return JSON.parse(response.text);
// }

const { genAI, geminiConfig, profilesConfig, safetySettings } = require('../config/gemini.config');
const POLITICAS_BANCO = require('../constants/informacion-simulacion/politicasBanco.constants');

async function generarEscenarioCliente(producto, tipo_cliente, perfil_cliente) {
  // ✅ System instruction va SEPARADO, no en contents
  const systemInstruction = `Eres un generador experto de perfiles de clientes bancarios realistas.
Debes crear perfiles coherentes, creíbles y detallados que reflejen situaciones reales.`;

  const prompt = `
Crea un perfil completo de cliente ficticio para este contexto bancario:

CONTEXTO DEL BANCO:
${JSON.stringify(POLITICAS_BANCO, null, 2)}

PRODUCTO DE INTERÉS:
${JSON.stringify(producto, null, 2)}

TIPO DE CLIENTE:
${JSON.stringify(tipo_cliente, null, 2)}

PERFIL ESPERADO:
${JSON.stringify(perfil_cliente, null, 2)}

INSTRUCCIONES:
- Crea un cliente REALISTA que encaje naturalmente con este producto
- El perfil debe ser coherente en todos sus aspectos
- La edad, profesión y situación deben estar alineadas
- El nivel de conocimiento financiero debe corresponder con su perfil
- El escenario narrativo debe ser específico y motivante

Devuelve SOLO el JSON sin texto adicional.
`;

  // ✅ Contents SOLO tiene el rol 'user', NO 'system'
  const contents = [
    {
      role: 'user',
      parts: [{ text: prompt }],
    },
  ];

  const schema = {
    type: 'object',
    properties: {
      nombre: { type: 'string', description: 'Nombre completo realista' },
      edad: { type: 'string', description: 'Edad coherente con el perfil' },
      profesion: { type: 'string', description: 'Profesión específica' },
      situacion_actual: { type: 'string', description: 'Situación financiera detallada' },
      motivacion: { type: 'string', description: 'Motivación clara para el producto' },
      nivel_conocimiento: { type: 'string', description: 'Bajo, Medio o Alto' },
      perfil_riesgo: { type: 'string', description: 'Conservador, Moderado o Agresivo' },
      objetivo: { type: 'string', description: 'Objetivo financiero específico' },
      escenario_narrativo: { type: 'string', description: 'Historia de fondo del cliente' },
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

  // ✅ systemInstruction va en la raíz del objeto de configuración
  const response = await genAI.models.generateContent({
    model: geminiConfig.model,
    systemInstruction: systemInstruction, // 👈 Aquí va el system instruction
    safetySettings: safetySettings.STRICT,
    contents: contents,
    config: {
      temperature: profilesConfig.CREATIVE.temperature,
      maxOutputTokens: profilesConfig.CREATIVE.maxOutputTokens,
      topP: profilesConfig.CREATIVE.topP,
      topK: profilesConfig.CREATIVE.topK,
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  });

  return JSON.parse(response.text);
}

module.exports = {
  generarEscenarioCliente,
};

// // CUANDO SE QUIERE QUE EL CLIENTE GENERE EL PRIMER MENSAJE DE LA ETAPA
// async function generarPrimerMensajeDelClientePorEtapa(etapa, cliente, producto, historialConversacion = []) {
//   // Construcción del historial como objetos de mensajes
//   const historialParts = historialConversacion.map((m) => ({
//     role: m.rol === 'cliente' ? 'model' : 'user',
//     parts: [
//       {
//         text: `
//           === CONTEXTO DE INTERACCIÓN ===
//           Etapa: ${m.etapa} (${m.indiceEtapa}/${m.totalEtapas})
//           Objetivo: ${m.objetivoEtapa}
//           Emisor: ${m.rol}
//           Receptor: ${m.receptor || 'Asesor'}
//           Mensaje: "${m.mensaje}"
//           ===============================
//         `.trim(),
//       },
//     ],
//   }));

//   const systemInstruction = `
//     Eres un cliente bancario ficticio participando en una simulación de asesoría financiera.
//     Información del cliente:
//     - Nombre: ${cliente.nombre}
//     - Edad: ${cliente.edad}
//     - Profesión: ${cliente.profesion}
//     - Situación actual: ${cliente.situacion_actual}
//     - Motivación: ${cliente.motivacion}
//     - Nivel de conocimiento: ${cliente.nivel_conocimiento}
//     - Perfil de riesgo: ${cliente.perfil_riesgo}
//     - Objetivo: ${cliente.objetivo}
//     - Escenario narrativo: ${cliente.escenario_narrativo}
//     - Producto de interés: ${producto}
//     - Etapa actual: ${etapa.nombre}
//     - Objetivo de la etapa: ${etapa.objetivo}
//     Debes responder de manera natural, breve y coherente con tu perfil y la conversación previa.
//     IMPORTANTES:
//       - NO reveles que eres una IA
//       - NO uses lenguaje formal excesivo
//   `.trim();

//   const prompt = `
//   Instrucciones por etapa:
//   ${etapa.instrucciones_ia}
//     Genera un mensaje natural del cliente (tú), breve y realista, coherente con la conversación previa y el objetivo de la etapa actual.
//     Responde **solo con JSON** con esta estructura:
//     {
//       "mensaje": "..."
//     }
//   `.trim();

//   // Estructura principal de la conversación
//   const contents = [
//     {
//       role: 'system',
//       parts: [{ text: systemInstruction }],
//     },
//     ...historialParts,
//     {
//       role: 'user',
//       parts: [{ text: prompt }],
//     },
//   ];

//   const schema = {
//     type: 'object',
//     properties: {
//       mensaje: { type: 'string', description: 'Mensaje natural del cliente' },
//     },
//     required: ['mensaje'],
//   };

//   // Llamada al modelo Gemini
//   const response = await genAI.models.generateContent({
//     model: geminiConfig.model,
//     safetySettings: safetySettings.STRICT,
//     contents: contents,
//     config: {
//       temperature: profilesConfig.CONVERSATIONAL.temperature,
//       maxOutputTokens: profilesConfig.CONVERSATIONAL.maxOutputTokens,
//       topP: profilesConfig.CONVERSATIONAL.topP,
//       topK: profilesConfig.CONVERSATIONAL.topK,
//       responseMimeType: 'application/json',
//       responseSchema: schema,
//     },
//   });

//   return JSON.parse(response.text);
// }

// // CUANDO SE QUIERE QUE EL ASESOR ENVIE EL SEGUNDO MENSAJE DE LA ETAPA SIN RECIBIR MENSAJE DE RESPUESTA DEL CLIENTE
// async function generarSegundoMensajeDelAsesorPorEtapa(
//   etapa,
//   cliente,
//   producto,
//   mensajeAsesor,
//   historialConversacion = []
// ) {
//   // ============================================
//   // 1. CONSTRUCCIÓN DEL HISTORIAL CONTEXTUAL
//   // ============================================
//   const historialTexto = historialConversacion
//     .map(
//       (m) => `
//       === CONTEXTO DE INTERACCIÓN ===
//       Etapa: ${m.etapa} (${m.indiceEtapa}/${m.totalEtapas})
//       Objetivo Etapa: ${m.objetivoEtapa}
//       Emisor: ${m.rol}
//       Receptor: ${m.receptor || 'Cliente'}
//       Mensaje: "${m.mensaje}"
//       ===============================`
//     )
//     .join('\n\n');

//   // ============================================
//   // 2. PROMPT DE EVALUACIÓN
//   // ============================================
//   const prompt = `
//     Eres un evaluador de simulaciones bancarias para entrenar asesores.
//     Tu tarea es analizar el segundo mensaje enviado por el ASESOR en una etapa específica
//     de una asesoría simulada y determinar si:
//       - El mensaje cumple el objetivo de la etapa.
//       - El mensaje mantiene coherencia con el producto y el perfil del cliente.
//       - El mensaje se sale del contexto o rompe la simulación.

//     CONTEXTO DEL CLIENTE:
//     - Nombre: ${cliente.nombre}
//     - Edad: ${cliente.edad}
//     - Profesión: ${cliente.profesion}
//     - Situación actual: ${cliente.situacion_actual}
//     - Motivación: ${cliente.motivacion}
//     - Nivel de conocimiento: ${cliente.nivel_conocimiento}
//     - Perfil de riesgo: ${cliente.perfil_riesgo}
//     - Objetivo financiero: ${cliente.objetivo}

//     PRODUCTO DE INTERÉS:
//     ${JSON.stringify(producto, null, 2)}

//     ETAPA ACTUAL:
//     - Nombre: ${etapa.nombre}
//     - Objetivo: ${etapa.objetivo}

//     HISTORIAL DE CONVERSACIÓN:
//     ${historialTexto ? historialTexto : 'No hay mensajes previos.'}

//     MENSAJE DEL ASESOR A EVALUAR:
//     "${mensajeAsesor}"

//     INSTRUCCIONES DE EVALUACIÓN:
//     - Evalúa si el mensaje del asesor se mantiene en el contexto del producto y objetivo de la etapa.
//     - Evalúa si el mensaje aporta valor y cumple con el propósito de la etapa (orientar, informar, cerrar, etc.).
//     - Si el mensaje se sale del contexto, marca "parar_simulacion": true.
//     - Si el mensaje cumple correctamente el objetivo de la etapa, marca "cerrar_etapa": true.
//     - Si el mensaje es apropiado pero no completa la etapa, deja ambas banderas en false.
//     - Incluye una breve justificación textual de la evaluación.

//     Devuelve únicamente el siguiente JSON:
//     {
//       "evaluacion": "string explicativa (1 o 2 frases)",
//       "parar_simulacion": boolean,
//       "cerrar_etapa": boolean
//     }
//   `;

//   // ============================================
//   // 3. DEFINICIÓN DE SCHEMA
//   // ============================================
//   const schema = {
//     type: 'object',
//     properties: {
//       evaluacion: { type: 'string', description: 'Breve explicación de la evaluación' },
//       parar_simulacion: { type: 'boolean', description: 'true si el asesor rompe el contexto' },
//       cerrar_etapa: { type: 'boolean', description: 'true si el mensaje cumple el objetivo de la etapa' },
//     },
//     required: ['evaluacion', 'parar_simulacion', 'cerrar_etapa'],
//   };

//   // ============================================
//   // 4. LLAMADA AL MODELO GEMINI
//   // ============================================
//   const response = await genAI.models.generateContent({
//     model: geminiConfig.model,
//     safetySettings: safetySettings.STRICT,
//     contents: prompt,
//     config: {
//       temperature: 0.3, // baja para evaluación más estable
//       maxOutputTokens: 300,
//       responseMimeType: 'application/json',
//       responseSchema: schema,
//     },
//   });

//   // ============================================
//   // 5. PROCESAR RESULTADO Y GUARDAR EN HISTORIAL
//   // ============================================
//   const evaluacion = JSON.parse(response.text);

//   const nuevoRegistro = {
//     etapa: etapa.nombre,
//     indiceEtapa: etapa.id,
//     rol: 'evaluador',
//     mensaje: evaluacion.evaluacion,
//     parar_simulacion: evaluacion.parar_simulacion,
//     cerrar_etapa: evaluacion.cerrar_etapa,
//     fecha: new Date(),
//   };

//   // Guardar en base de datos o historial local según tu flujo
//   // Ejemplo: await guardarEnHistorialConversacion(nuevoRegistro);

//   return evaluacion;
// }

// // CUANDO SE QUIERE QUE EL ASESOR ENVIE EL PRIMER MENSAJE DE LA ETAPA
// // CUANDO SE QUIERE QUE EL CLIENTE GENERE EL SEGUNDO MENSAJE DE LA ETAPA
// async function generarConversacionAsesorClientePorEtapa(
//   etapa,
//   cliente,
//   producto,
//   mensajeAsesor,
//   historialConversacion = []
// ) {
//   const historialTexto = historialConversacion
//     .map(
//       (m) =>
//         `
//         === CONTEXTO DE INTERACCIÓN ===
//         Ubicación Etapa: ${m.indiceEtapa}/${m.totalEtapas}
//         Nombre Etapa: ${m.etapa}
//         Objetivo Etapa: ${m.objetivoEtapa}
//         Emisor: ${m.rol}
//         Receptor: ${m.receptor || 'Asesor'}
//         Mensaje: "${m.mensaje}"
//         ===============================
//       `
//     )
//     .join('\n\n');

//   const prompt = `
//     Eres el cliente ${cliente.nombre},
//     de ${cliente.edad} años,
//     tu profesion es: ${cliente.profesion},
//     tu situacion actual es: ${cliente.situacion_actual},
//     tu motivacion es: ${cliente.motivacion},
//     tu nivel de conocimiento es: ${cliente.nivel_conocimiento},
//     tu perfil de riesgo es: ${cliente.perfil_riesgo},
//     tu objetivo es: ${cliente.objetivo},
//     tu escenario narrativo es: ${cliente.escenario_narrativo}.
//     tu Producto de interés: ${producto}.
//     estas en la etapa de conversacion actual: ${etapa.nombre},
//     el objetivo de la etapa es: ${etapa.objetivo},
//     el historial de la conversacion es:
//     ${historialTexto ? `Conversación previa:\n${historialTexto}\n` : ''}

//     El asesor te dijo: "${mensajeAsesor}"

//     Responde como cliente real, de forma natural y breve.
//   `;

//   const schema = {
//     type: 'object',
//     properties: {
//       mensaje: { type: 'string' },
//     },
//     required: ['mensaje'],
//   };

//   const response = await genAI.models.generateContent({
//     model: geminiConfig.model,
//     contents: prompt,
//     config: {
//       temperature: geminiConfig.temperature,
//       maxOutputTokens: geminiConfig.maxOutputTokens,
//       responseMimeType: 'application/json',
//       responseSchema: schema,
//     },
//   });

//   return JSON.parse(response.text);
// }

// async function analizarEstadoConversacion(historialConversacion = [], modoAprendizaje) {
//   const historialParts = historialConversacion.map((m) => ({
//     role: m.rol === 'cliente' ? 'model' : 'user',
//     parts: [
//       {
//         text: `
//           === CONTEXTO DE INTERACCIÓN ===
//           Etapa: ${m.etapa} (${m.indiceEtapa}/${m.totalEtapas})
//           Objetivo: ${m.objetivoEtapa}
//           Emisor: ${m.rol}
//           Receptor: ${m.receptor || 'Asesor'}
//           Mensaje: "${m.mensaje}"
//           ===============================
//         `.trim(),
//       },
//     ],
//   }));

//   if (modoAprendizaje === true) {
//     const modoAprendizaje = `El modo aprendizaje está activado. Debes proporcionar retroalimentación detallada y constructiva al asesor en cada evaluación, destacando tanto las fortalezas como las áreas de mejora en su desempeño.`;
//   } else {
//     const modoAprendizaje = `El modo aprendizaje está desactivado. no proporciones informacion`;
//   }

//   const systemInstruction = `Eres analizador experto de la conversacion entre un asesor bancario y un cliente ficticio.
//   Debes evaluar si la conversacion se mantiene en el contexto del producto financiero y el perfil del cliente.
//   Identifica si el asesor cumple con los objetivos de cada etapa de la asesoría.
//   Detecta si hay rupturas de contexto o incoherencias. Si es asi debes marcar como true la bandera "parar_simulacion". para indicar que la simulacion debe detenerse. ${modoAprendizaje}`;

//   const prompt = ` Analiza el siguiente historial de conversación de la simulación bancaria
//   `.trim();

//   // Estructura principal de la conversación
//   const contents = [
//     {
//       role: 'system',
//       parts: [{ text: systemInstruction }],
//     },
//     ...historialParts,
//     {
//       role: 'user',
//       parts: [{ text: prompt }],
//     },
//   ];

//   const schema = {
//     type: 'object',
//     properties: {
//       detener_simulacion: { type: 'boolean', description: 'Indica si se debe detener la simulación' },
//       mensaje_modoAprendizaje: { type: 'string', description: 'Mensaje sobre el modo de aprendizaje' },
//     },
//     required: [
//       'detener_simulacion', 'mensaje_modoAprendizaje'
//     ],
//   };

//   const response = await genAI.models.generateContent({
//     model: geminiConfig.model,
//     safetySettings: safetySettings.STRICT,
//     contents: contents,
//     config: {
//       temperature: profilesConfig.CREATIVE.temperature,
//       maxOutputTokens: profilesConfig.CREATIVE.maxOutputTokens,
//       topP: profilesConfig.CREATIVE.topP,
//       topK: profilesConfig.CREATIVE.topK,
//       responseMimeType: 'application/json',
//       responseSchema: schema,
//     },
//   });

//   return JSON.parse(response.text);
// }

// async function analizarDesempenoAsesor(simulacionId) {
//   const historial = obtenerHistorialChat(simulacionId);
//   const sesion = sessionesActivas.get(simulacionId);

//   if (!sesion) {
//     throw new Error('Sesión no encontrada');
//   }

//   const { cliente, producto } = sesion;

//   const prompt = `Analiza el desempeño del asesor en esta simulación:

// CLIENTE: ${cliente.nombre}
// PRODUCTO: ${producto}
// PERFIL: ${cliente.nivel_conocimiento} conocimiento, ${cliente.perfil_riesgo} riesgo

// CONVERSACIÓN:
// ${historial.map(h => `${h.rol}: ${h.mensaje}`).join('\n')}

// Proporciona:
// 1. Calificación (0-10)
// 2. Fortalezas (máx 3 puntos)
// 3. Áreas de mejora (máx 3 puntos)
// 4. Recomendación principal

// Formato JSON conciso.`;

//   try {
//     const response = await ai.models.generateContent({
//       model: MODELS.FAST,
//       contents: prompt,
//       config: {
//         temperature: 0.3, // Más objetivo para evaluación
//         maxOutputTokens: 800,
//         responseMimeType: 'application/json',
//       },
//     });

//     return JSON.parse(response.text);
//   } catch (error) {
//     console.error('Error en análisis:', error);
//     return null;
//   }
// }

module.exports = { generarEscenarioCliente };
