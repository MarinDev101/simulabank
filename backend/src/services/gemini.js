// Importar configuracion necesaria
const { genAI, geminiConfig } = require('../config/gemini.config');
const { pool } = require('../config/database.config');
const { mapSimulacionToDb, mapDbToSimulacion } = require('../models/simulacion.model');
const { TABLAS, CAMPOS_ID } = require('../constants/informacion-database/auth.constants');

// Importar constantes de informacion de simulacion
const POLITICAS_BANCO = require('../constants/informacion-simulacion/politicasBanco.constants');
const PRODUCTOS_FINANCIEROS = require('../constants/informacion-simulacion/productosFinancieros.constants');
const TIPOS_CLIENTES = require('../constants/informacion-simulacion/tiposClientes.constants');
const PERFILES_CLIENTES = require('../constants/informacion-simulacion/perfilesClientes.constants');
const ETAPAS_PRODUCTOS = require('../constants/informacion-simulacion/etapasConversacion.constants');

// Importar Funciones de utilidad
const {
  obtenerProductoEspecifico,
  obtenerTipoClienteAleatorio,
  obtenerPerfilPorProducto,
} = require('../utils/funciones-simulacion');

// Almacén temporal de simulaciones activas (en producción usa Redis o base de datos)
const simulacionesActivas = new Map();

async function generarEscenarioCliente(nombreProducto) {
  const producto = obtenerProductoEspecifico(nombreProducto, PRODUCTOS_FINANCIEROS);
  const tipoCliente = obtenerTipoClienteAleatorio(TIPOS_CLIENTES);
  const perfilCliente = obtenerPerfilPorProducto(nombreProducto, PERFILES_CLIENTES);

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
    Incluye nombre, edad, profesion, situacion_actual, motivacion, nivel_conocimiento, perfil_riesgo, objetivo, escenario_narrativo.
  `;

  const schema = {
    type: 'object',
    properties: {
      nombre: { type: 'string' },
      edad: { type: 'string' },
      profesion: { type: 'string' },
      situacion_actual: { type: 'string' },
      motivacion: { type: 'string' },
      nivel_conocimiento: { type: 'string' },
      perfil_riesgo: { type: 'string' },
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

async function mensajeInicialCliente(etapa, cliente, producto, historialConversacion = []) {
  const historialTexto = historialConversacion
    .map(
      (m) =>
        `
        === CONTEXTO DE INTERACCIÓN ===
        Ubicación Etapa: ${m.indiceEtapa}/${m.totalEtapas}
        Nombre Etapa: ${m.etapa}
        Objetivo Etapa: ${m.objetivoEtapa}
        Emisor: ${m.rol}
        Receptor: ${m.receptor || 'Asesor'}
        Mensaje: "${m.mensaje}"
        ===============================
      `
    )
    .join('\n\n');

  const prompt = `
    Eres el cliente ${cliente.nombre},
    de ${cliente.edad} años,
    tu profesion es: ${cliente.profesion},
    tu situacion actual es: ${cliente.situacion_actual},
    tu motivacion es: ${cliente.motivacion},
    tu nivel de conocimiento es: ${cliente.nivel_conocimiento},
    tu perfil de riesgo es: ${cliente.perfil_riesgo},
    tu objetivo es: ${cliente.objetivo},
    tu escenario narrativo es: ${cliente.escenario_narrativo}.
    tu Producto de interés: ${producto}.
    estas en la etapa de conversacion actual: ${etapa.nombre},
    el objetivo de la etapa es: ${etapa.objetivo},
    el historial de la conversacion es:
    ${historialTexto ? `Conversación previa:\n${historialTexto}\n` : ''}

    Genera un mensaje natural del cliente, breve y realista para esta etapa.
    Mantén coherencia con la conversación previa.
  `;

  const schema = {
    type: 'object',
    properties: {
      mensaje: { type: 'string' },
    },
    required: ['mensaje'],
  };

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

async function mensajeInicialAsesor(
  etapa,
  cliente,
  producto,
  mensajeAsesor,
  historialConversacion = []
) {
  const historialTexto = historialConversacion
    .map(
      (m) =>
        `
        === CONTEXTO DE INTERACCIÓN ===
        Ubicación Etapa: ${m.indiceEtapa}/${m.totalEtapas}
        Nombre Etapa: ${m.etapa}
        Objetivo Etapa: ${m.objetivoEtapa}
        Emisor: ${m.rol}
        Receptor: ${m.receptor || 'Asesor'}
        Mensaje: "${m.mensaje}"
        ===============================
      `
    )
    .join('\n\n');

  const prompt = `
    Eres el cliente ${cliente.nombre},
    de ${cliente.edad} años,
    tu profesion es: ${cliente.profesion},
    tu situacion actual es: ${cliente.situacion_actual},
    tu motivacion es: ${cliente.motivacion},
    tu nivel de conocimiento es: ${cliente.nivel_conocimiento},
    tu perfil de riesgo es: ${cliente.perfil_riesgo},
    tu objetivo es: ${cliente.objetivo},
    tu escenario narrativo es: ${cliente.escenario_narrativo}.
    tu Producto de interés: ${producto}.
    estas en la etapa de conversacion actual: ${etapa.nombre},
    el objetivo de la etapa es: ${etapa.objetivo},
    el historial de la conversacion es:
    ${historialTexto ? `Conversación previa:\n${historialTexto}\n` : ''}

    El asesor te dijo: "${mensajeAsesor}"

    Responde como cliente real, de forma natural y breve.
    Si el mensaje del asesor se sale del contexto de la simulacion de asesoria bancaria, responde true en "parar_simulacion".
  `;

  const schema = {
    type: 'object',
    properties: {
      mensaje: { type: 'string' },
      parar_simulacion: { type: 'boolean' },
    },
    required: ['mensaje'],
  };

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

// FUNCIONES QUE QUIERO QUE UTILICES EN EL SIMULACION.CONTROLLER.JS para dividir responsabilidades

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
