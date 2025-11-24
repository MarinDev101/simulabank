const { pool } = require('../config/database.config');
const geminiService = require('../services/gemini');
const pdfService = require('../services/pdf');
const { default: fetch } = require('node-fetch');

/**
 * Función auxiliar para calcular duración en segundos
 */
function calcularDuracionSegundos(fechaInicio) {
  return Math.floor((new Date() - new Date(fechaInicio)) / 1000);
}

/**
 * Función auxiliar para formatear duración en formato legible
 */
function formatearDuracion(segundos) {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = segundos % 60;

  if (horas > 0) {
    return `${horas}h ${minutos}m ${segs}s`;
  } else if (minutos > 0) {
    return `${minutos}m ${segs}s`;
  } else {
    return `${segs}s`;
  }
}

/**
 * Función auxiliar para parsear JSON de la base de datos
 */
function parsearJSON(data, nombreCampo = 'campo', valorPorDefecto = []) {
  try {
    // Si es Buffer, convertir a string
    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }

    // Si ya es un array, devolverlo
    if (Array.isArray(data)) {
      return data;
    }

    // Si es string no vacío, parsearlo
    if (typeof data === 'string' && data.trim() !== '') {
      return JSON.parse(data);
    }

    // Si es objeto pero no array, devolverlo (podría ser JSON parseado por mysql)
    if (typeof data === 'object' && data !== null) {
      return data;
    }

    // En cualquier otro caso, devolver valor por defecto
    return valorPorDefecto;
  } catch (err) {
    console.error(`⚠️ Error parseando ${nombreCampo}:`, err);
    return valorPorDefecto;
  }
}

/**
 * Obtiene datos completos de simulación para generar PDF
 * (versión simplificada para uso interno)
 */
async function obtenerDatosParaPdf(idSimulacion) {
  const [[simulacion]] = await pool.query('SELECT * FROM simulaciones WHERE id_simulacion = ?', [
    idSimulacion,
  ]);
  if (!simulacion) return null;

  const [[usuario]] = await pool.query(
    'SELECT id_usuario, correo_electronico, nombres, apellidos FROM usuarios WHERE id_usuario = ?',
    [simulacion.id_aprendiz]
  );

  const [[producto]] = await pool.query(
    'SELECT * FROM productos_bancarios WHERE id_producto_bancario = ?',
    [simulacion.id_producto_bancario]
  );

  const [[clienteSimulado]] = await pool.query(
    'SELECT * FROM clientes_simulados WHERE id_simulacion = ?',
    [idSimulacion]
  );

  const [[tipoCliente]] = await pool.query(
    'SELECT * FROM tipos_clientes WHERE id_tipo_cliente = ?',
    [clienteSimulado?.id_tipo_cliente]
  );

  const [[perfilCliente]] = await pool.query(
    'SELECT * FROM perfiles_clientes WHERE id_perfil_cliente = ?',
    [clienteSimulado?.id_perfil_cliente]
  );

  const [etapas] = await pool.query(
    'SELECT * FROM etapas_conversacion WHERE id_producto_bancario = ? ORDER BY numero_orden',
    [simulacion.id_producto_bancario]
  );

  return {
    simulacion: {
      id: simulacion.id_simulacion,
      modo: simulacion.modo,
      estado: simulacion.estado,
      productoSeleccion: simulacion.producto_seleccion,
      destinoEvidencia: simulacion.destino_evidencia,
      sonidoInteraccion: simulacion.sonido_interaccion,
      etapaActualIndex: simulacion.etapa_actual_index,
      totalEtapas: etapas.length,
      duracionSegundos: simulacion.tiempo_duracion_segundos,
      duracionFormato: formatearDuracion(simulacion.tiempo_duracion_segundos || 0),
      fechaInicio: simulacion.fecha_inicio,
      fechaFinalizacion: simulacion.fecha_finalizacion,
    },
    aprendiz: {
      id: usuario?.id_usuario,
      nombres: usuario?.nombres,
      apellidos: usuario?.apellidos,
      correo: usuario?.correo_electronico,
      nombreCompleto: `${usuario?.nombres || ''} ${usuario?.apellidos || ''}`.trim(),
    },
    producto: {
      id: producto?.id_producto_bancario,
      nombre: producto?.nombre,
      categoria: producto?.categoria,
      concepto: producto?.concepto,
      caracteristicas: parsearJSON(producto?.caracteristicas, []),
      beneficios: parsearJSON(producto?.beneficios, []),
      requisitos: parsearJSON(producto?.requisitos, []),
    },
    clienteSimulado: {
      genero: clienteSimulado?.genero,
      avatar: clienteSimulado?.urlAvatar,
      nombre: clienteSimulado?.nombre,
      edad: clienteSimulado?.edad,
      profesion: clienteSimulado?.profesion,
      situacionActual: clienteSimulado?.situacion_actual,
      motivacion: clienteSimulado?.motivacion,
      nivelConocimiento: clienteSimulado?.nivel_conocimiento,
      perfilRiesgo: clienteSimulado?.perfil_riesgo,
      objetivo: clienteSimulado?.objetivo,
      escenarioNarrativo: clienteSimulado?.escenario_narrativo,
    },
    tipoCliente: {
      id: tipoCliente?.id_tipo_cliente,
      tipo: tipoCliente?.tipo,
      actua: tipoCliente?.actua,
      ejemplo: tipoCliente?.ejemplo,
    },
    perfilCliente: {
      id: perfilCliente?.id_perfil_cliente,
      nombre: perfilCliente?.nombre,
      tipoCliente: perfilCliente?.tipo_cliente,
      rangoCop: perfilCliente?.rango_cop,
      enfoqueAtencion: perfilCliente?.enfoque_atencion,
    },
    etapas,
    conversacion: parsearJSON(simulacion.conversacion_asesoria, []),
    recomendaciones: parsearJSON(simulacion.recomendaciones_aprendizaje_ia, []),
    aspectosClave: parsearJSON(simulacion.aspectos_clave_registrados, []),
    analisisDesempeno: parsearJSON(simulacion.analisis_desempeno, null),
    evidencia: { numeroEvidencia: null, fechaAgregado: null, estado: null, carpeta: null },
  };
}

/**
 * Crea la evidencia personal al finalizar una simulación
 * Solo se crea si destino_evidencia = 'personal'
 * @param {number} idSimulacion - ID de la simulación finalizada
 * @param {number} idAprendiz - ID del aprendiz
 * @returns {Object|null} - Datos de la evidencia creada o null si no aplica
 */
async function crearEvidenciaPersonal(idSimulacion, idAprendiz) {
  try {
    // Verificar que la simulación exista y su destino sea 'personal'
    const [[simulacion]] = await pool.query(
      `SELECT id_simulacion, destino_evidencia, estado
       FROM simulaciones
       WHERE id_simulacion = ? AND id_aprendiz = ?`,
      [idSimulacion, idAprendiz]
    );

    if (!simulacion) {
      console.log(`⚠️ Simulación ${idSimulacion} no encontrada para crear evidencia`);
      return null;
    }

    // Solo crear evidencia si el destino es 'personal'
    if (simulacion.destino_evidencia !== 'personal') {
      console.log(
        `ℹ️ Simulación ${idSimulacion} tiene destino '${simulacion.destino_evidencia}', no se crea evidencia personal`
      );
      return null;
    }

    // Verificar que no exista ya una evidencia para esta simulación
    const [[evidenciaExistente]] = await pool.query(
      'SELECT id_simulacion FROM evidencias_personales WHERE id_simulacion = ?',
      [idSimulacion]
    );

    if (evidenciaExistente) {
      console.log(`ℹ️ Ya existe evidencia para simulación ${idSimulacion}`);
      return { yaExiste: true, idSimulacion };
    }

    // Obtener número secuencial de evidencia para este aprendiz
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM evidencias_personales ep
       INNER JOIN simulaciones s ON s.id_simulacion = ep.id_simulacion
       WHERE s.id_aprendiz = ?`,
      [idAprendiz]
    );

    const numeroEvidencia = total + 1;

    // Obtener datos completos para generar el PDF y calcular peso
    const datosSimulacion = await obtenerDatosParaPdf(idSimulacion);

    if (!datosSimulacion) {
      console.error(`❌ No se pudieron obtener datos de simulación ${idSimulacion}`);
      return null;
    }

    // Generar PDF solo para obtener el peso (no el buffer completo)
    let pesoKb = null;
    try {
      const { pesoKb: peso } = await pdfService.generarPdfEvidencia(datosSimulacion, true);
      pesoKb = peso;
      console.log(`📄 Peso del PDF calculado: ${pesoKb} KB`);
    } catch (pdfError) {
      console.error('⚠️ Error calculando peso del PDF:', pdfError.message);
      // Continuar sin el peso si falla
    }

    // Crear registro de evidencia personal
    await pool.query(
      `INSERT INTO evidencias_personales
       (id_simulacion, id_carpeta_personal, numero_evidencia, estado, peso_pdf_kb)
       VALUES (?, NULL, ?, 'visible', ?)`,
      [idSimulacion, numeroEvidencia, pesoKb]
    );

    console.log(`✅ Evidencia personal #${numeroEvidencia} creada para simulación ${idSimulacion}`);

    return {
      idSimulacion,
      numeroEvidencia,
      pesoKb,
      estado: 'visible',
    };
  } catch (error) {
    console.error(`❌ Error creando evidencia personal para simulación ${idSimulacion}:`, error);
    return null;
  }
}

/**
 * 🆕 Función auxiliar para obtener el estado completo de una simulación
 * Esta función centraliza la lógica de obtención de datos para que
 * tanto iniciarSimulacion como obtenerEstado devuelvan la misma estructura
 */
async function obtenerEstadoCompleto(idSimulacion) {
  // Obtener simulación
  const [[simulacion]] = await pool.query('SELECT * FROM simulaciones WHERE id_simulacion = ?', [
    idSimulacion,
  ]);

  if (!simulacion) {
    throw new Error('Simulación no encontrada');
  }

  // Obtener producto bancario
  const [[producto]] = await pool.query(
    'SELECT * FROM productos_bancarios WHERE id_producto_bancario = ?',
    [simulacion.id_producto_bancario]
  );

  // Obtener cliente simulado
  const [[clienteSimulado]] = await pool.query(
    'SELECT * FROM clientes_simulados WHERE id_simulacion = ?',
    [idSimulacion]
  );

  // Obtener tipo de cliente
  const [[tipoCliente]] = await pool.query(
    'SELECT * FROM tipos_clientes WHERE id_tipo_cliente = ?',
    [clienteSimulado.id_tipo_cliente]
  );

  // Obtener perfil de cliente
  const [[perfilCliente]] = await pool.query(
    'SELECT * FROM perfiles_clientes WHERE id_perfil_cliente = ?',
    [clienteSimulado.id_perfil_cliente]
  );

  // Obtener etapa actual
  const [[etapaActual]] = await pool.query(
    `SELECT * FROM etapas_conversacion
     WHERE id_producto_bancario = ? AND numero_orden = ? LIMIT 1`,
    [simulacion.id_producto_bancario, simulacion.etapa_actual_index]
  );

  // Obtener total de etapas
  const [[{ total: totalEtapas }]] = await pool.query(
    'SELECT COUNT(*) AS total FROM etapas_conversacion WHERE id_producto_bancario = ?',
    [simulacion.id_producto_bancario]
  );

  // Parsear historial de conversación
  const historialConversacion = parsearJSON(
    simulacion.conversacion_asesoria,
    'conversacion_asesoria',
    []
  );

  // Parsear recomendaciones de aprendizaje
  const recomendacionesAprendizaje = parsearJSON(
    simulacion.recomendaciones_aprendizaje_ia,
    'recomendaciones_aprendizaje_ia',
    []
  );

  // Parsear aspectos clave registrados
  const aspectosClave = parsearJSON(
    simulacion.aspectos_clave_registrados,
    'aspectos_clave_registrados',
    []
  );

  // Parsear análisis de desempeño (si existe)
  let analisisDesempeno = null;
  if (simulacion.analisis_desempeno) {
    analisisDesempeno = parsearJSON(simulacion.analisis_desempeno, 'analisis_desempeno', null);
  }

  // Calcular duración en segundos
  const duracionSegundos = calcularDuracionSegundos(simulacion.fecha_inicio);

  // Construir objeto de escenario del cliente con imagen
  const escenarioCliente = {
    genero: clienteSimulado.genero,
    imagen: clienteSimulado.urlAvatar,
    nombre: clienteSimulado.nombre,
    edad: clienteSimulado.edad,
    profesion: clienteSimulado.profesion,
    situacion_actual: clienteSimulado.situacion_actual,
    motivacion: clienteSimulado.motivacion,
    nivel_conocimiento: clienteSimulado.nivel_conocimiento,
    perfil_riesgo: clienteSimulado.perfil_riesgo,
    objetivo: clienteSimulado.objetivo,
    escenario_narrativo: clienteSimulado.escenario_narrativo,
  };

  // 🎯 Estructura unificada de respuesta
  return {
    simulacion: {
      id_simulacion: simulacion.id_simulacion,
      estado: simulacion.estado,
      modo: simulacion.modo,
      destino_evidencia: simulacion.destino_evidencia,
      sonido_interaccion: simulacion.sonido_interaccion,
      producto_seleccion: simulacion.producto_seleccion,
      etapa_actual_index: simulacion.etapa_actual_index,
      total_etapas: totalEtapas,
      duracion_segundos: duracionSegundos,
      duracion_formato: formatearDuracion(duracionSegundos),
      fecha_inicio: simulacion.fecha_inicio,
      fecha_ultima_interaccion: simulacion.fecha_ultima_interaccion,
      fecha_finalizacion: simulacion.fecha_finalizacion,
    },
    producto: producto,
    tipo_cliente: tipoCliente,
    perfil_cliente: perfilCliente,
    escenario_cliente: escenarioCliente,
    etapa_actual: etapaActual,
    historial_conversacion: historialConversacion,
    recomendaciones_aprendizaje: recomendacionesAprendizaje,
    aspectos_clave: aspectosClave,
    analisis_desempeno: analisisDesempeno,
  };
}

async function obtenerTotalEtapas(idProductoBancario) {
  const [[{ total }]] = await pool.query(
    'SELECT COUNT(*) AS total FROM etapas_conversacion WHERE id_producto_bancario = ?',
    [idProductoBancario]
  );
  return total;
}

/**
 * POST /api/simulacion/iniciar
 * Inicia una nueva simulación
 */
exports.iniciarSimulacion = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { configuracion } = req.body;
    const nombreProducto = configuracion.nombreProducto;

    // =====================================================
    // 1️⃣ Verificar simulación activa o pausada
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
    // 2️⃣ Obtener producto bancario
    // =====================================================
    const [productos] = await pool.query('SELECT * FROM productos_bancarios WHERE nombre = ?', [
      nombreProducto,
    ]);
    const producto = productos[0];
    if (!producto) {
      return res.status(404).json({
        ok: false,
        error: 'Producto no encontrado',
        mensaje: `No se encontró un producto bancario con el nombre "${nombreProducto}".`,
      });
    }

    // =====================================================
    // 3️⃣ Tipo de cliente aleatorio
    // =====================================================
    const [tiposClientes] = await pool.query(
      'SELECT * FROM tipos_clientes ORDER BY RAND() LIMIT 1'
    );
    const tipoClienteAleatorio = tiposClientes[0];
    if (!tipoClienteAleatorio) {
      return res.status(404).json({
        ok: false,
        error: 'Tipo de cliente no encontrado',
      });
    }

    // =====================================================
    // 4️⃣ Perfil de cliente asociado al producto
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
    const perfilClienteAleatorio = perfilesAsociados[0];
    if (!perfilClienteAleatorio) {
      return res.status(404).json({
        ok: false,
        error: 'Perfil no encontrado',
        mensaje: `No se encontró ningún perfil asociado al producto "${nombreProducto}".`,
      });
    }

    // =====================================================
    // 5️⃣ Generar escenario del cliente con Gemini 🤖
    // =====================================================
    let escenarioCliente;
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
    // 5.1️⃣ Obtener imagen de avatar según el género 🎨
    // =====================================================
    let urlAvatar = null;
    try {
      const generoApi =
        escenarioCliente.genero.toLowerCase() === 'hombre'
          ? 'male'
          : escenarioCliente.genero.toLowerCase() === 'mujer'
            ? 'female'
            : 'female';

      const resAvatar = await fetch(`https://randomuser.me/api/?gender=${generoApi}`);
      if (!resAvatar.ok) throw new Error(`HTTP ${resAvatar.status}`);
      const dataAvatar = await resAvatar.json();
      urlAvatar = dataAvatar?.results?.[0]?.picture?.large || null;
    } catch (error) {
      console.error('Error al obtener avatar:', error);
    } finally {
      if (!urlAvatar) {
        urlAvatar =
          escenarioCliente.genero.toLowerCase() === 'hombre'
            ? 'https://randomuser.me/api/portraits/men/14.jpg'
            : 'https://randomuser.me/api/portraits/women/8.jpg';
      }
    }

    // =====================================================
    // 6️⃣ Crear simulación (inicia con etapa_actual_index = 1)
    // =====================================================
    const { modo, destino, interaccion } = configuracion;

    const [result] = await pool.query(
      `INSERT INTO simulaciones (
        id_aprendiz,
        id_producto_bancario,
        producto_seleccion,
        modo,
        destino_evidencia,
        sonido_interaccion,
        perfil_cliente,
        aspectos_clave_registrados,
        conversacion_asesoria,
        recomendaciones_aprendizaje_ia,
        estado,
        etapa_actual_index
      )
      VALUES (?, ?, 'especifico', ?, ?, ?, '{}', '[]', '[]', '[]', 'en_proceso', 1)`,
      [userId, producto.id_producto_bancario, modo, destino, interaccion]
    );

    const idNuevaSimulacion = result.insertId;

    // =====================================================
    // 7️⃣ Guardar cliente simulado con imagen 📸
    // =====================================================
    await pool.query(
      `INSERT INTO clientes_simulados (
        id_simulacion,
        genero,
        urlAvatar,
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idNuevaSimulacion,
        escenarioCliente.genero,
        urlAvatar,
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
    // 8️⃣ Verificar quién inicia la etapa 1
    // =====================================================
    const [etapas] = await pool.query(
      `SELECT * FROM etapas_conversacion
       WHERE id_producto_bancario = ?
       AND numero_orden = 1
       LIMIT 1`,
      [producto.id_producto_bancario]
    );

    const etapaActual = etapas[0];
    let mensajeInicialCliente = null;

    if (etapaActual && etapaActual.quien_inicia === 'Cliente') {
      try {
        mensajeInicialCliente = await geminiService.generarMensajeCliente(
          producto,
          tipoClienteAleatorio,
          perfilClienteAleatorio,
          escenarioCliente,
          [],
          etapaActual,
          { esPrimerMensaje: true }
        );

        const totalEtapas = await obtenerTotalEtapas(producto.id_producto_bancario);

        const primerMensaje = {
          indiceEtapa: 1,
          totalEtapas: totalEtapas,
          nombreEtapa: etapaActual.nombre,
          objetivoEtapa: etapaActual.objetivo,
          emisor: 'Cliente',
          mensaje: mensajeInicialCliente.mensaje,
          receptor: 'Asesor',
        };

        await pool.query(
          'UPDATE simulaciones SET conversacion_asesoria = ? WHERE id_simulacion = ?',
          [JSON.stringify([primerMensaje]), idNuevaSimulacion]
        );
      } catch (error) {
        console.error('Error al generar primer mensaje del cliente:', error);
      }
    }

    // =====================================================
    // 9️⃣ GENERAR ANÁLISIS INICIAL SI ES MODO APRENDIZAJE 📚
    // =====================================================
    if (modo === 'aprendizaje' && etapaActual) {
      try {
        console.log('🎓 Generando análisis inicial de aprendizaje para etapa 1...');

        const totalEtapas = await obtenerTotalEtapas(producto.id_producto_bancario);

        // Historial inicial (puede estar vacío o con el primer mensaje del cliente)
        const historialInicial = mensajeInicialCliente
          ? [
              {
                indiceEtapa: 1,
                totalEtapas: totalEtapas,
                nombreEtapa: etapaActual.nombre,
                objetivoEtapa: etapaActual.objetivo,
                emisor: 'Cliente',
                mensaje: mensajeInicialCliente.mensaje,
                receptor: 'Asesor',
              },
            ]
          : [];

        const resultadoAnalisis =
          await geminiService.generarAnalisisSimulacionPorEtapaModoAprendizaje(
            producto,
            tipoClienteAleatorio,
            perfilClienteAleatorio,
            escenarioCliente,
            historialInicial,
            etapaActual
          );

        const analisisInicialAprendizaje = {
          indiceEtapa: 1,
          nombreEtapa: etapaActual.nombre,
          objetivoEtapa: etapaActual.objetivo,
          recomendacionParaAsesor: resultadoAnalisis.recomendaciones_aprendizaje,
        };

        // Guardar el análisis inicial en la base de datos
        await pool.query(
          'UPDATE simulaciones SET recomendaciones_aprendizaje_ia = ? WHERE id_simulacion = ?',
          [JSON.stringify([analisisInicialAprendizaje]), idNuevaSimulacion]
        );

        console.log('✅ Análisis inicial guardado correctamente');
      } catch (error) {
        console.error('❌ Error al generar análisis inicial de aprendizaje:', error);
        // No detener el flujo si falla el análisis
      }
    }

    // =====================================================
    // 🔟 Obtener estado completo usando la función auxiliar
    // =====================================================
    const estadoCompleto = await obtenerEstadoCompleto(idNuevaSimulacion);

    // =====================================================
    // 📟 Respuesta final al frontend
    // =====================================================
    return res.status(201).json({
      ok: true,
      mensaje: 'Simulación iniciada correctamente.',
      ...estadoCompleto,
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

/**
 * POST /api/simulacion/mensaje
 * Envía un mensaje del asesor y recibe respuesta del cliente
 */
function debeAvanzarDeEtapa(etapaActual, historialConversacion) {
  const mensajesEtapa = historialConversacion.filter(
    (m) => m.indiceEtapa === etapaActual.numero_orden
  );

  const minimoMensajes = etapaActual.quien_inicia === 'Cliente' ? 3 : 2;

  return {
    debeAvanzar: mensajesEtapa.length >= minimoMensajes,
    mensajesEtapa,
    minimoMensajes,
  };
}

exports.enviarMensaje = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { mensaje } = req.body;
    let evidenciaCreada = null;

    // ===============================================
    // 1️⃣ Validar mensaje no vacío
    // ===============================================
    if (!mensaje || mensaje.trim().length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'Mensaje vacío',
        mensaje: 'El campo "mensaje" es obligatorio.',
      });
    }

    // ===============================================
    // 2️⃣ Buscar simulación activa (en_proceso)
    // ===============================================
    const [simulaciones] = await pool.query(
      'SELECT * FROM simulaciones WHERE id_aprendiz = ? AND estado = ? LIMIT 1',
      [userId, 'en_proceso']
    );

    const simulacion = simulaciones[0];
    if (!simulacion) {
      return res.status(404).json({
        ok: false,
        error: 'Simulación no encontrada',
        mensaje: 'No existe una simulación en proceso. Inicia una nueva.',
      });
    }

    // ===============================================
    // 3️⃣ Obtener producto, escenario y datos base
    // ===============================================
    const [[producto]] = await pool.query(
      'SELECT * FROM productos_bancarios WHERE id_producto_bancario = ?',
      [simulacion.id_producto_bancario]
    );

    const [[escenarioCliente]] = await pool.query(
      'SELECT * FROM clientes_simulados WHERE id_simulacion = ?',
      [simulacion.id_simulacion]
    );

    const [[tipoClienteAleatorio]] = await pool.query(
      'SELECT * FROM tipos_clientes WHERE id_tipo_cliente = ?',
      [escenarioCliente.id_tipo_cliente]
    );

    const [[perfilClienteAleatorio]] = await pool.query(
      'SELECT * FROM perfiles_clientes WHERE id_perfil_cliente = ?',
      [escenarioCliente.id_perfil_cliente]
    );

    const [[etapaActual]] = await pool.query(
      `SELECT * FROM etapas_conversacion
       WHERE id_producto_bancario = ? AND numero_orden = ? LIMIT 1`,
      [simulacion.id_producto_bancario, simulacion.etapa_actual_index]
    );

    const totalEtapas = await obtenerTotalEtapas(producto.id_producto_bancario);

    // Guardar: si no existe la etapa actual, evitar crash y devolver mensaje claro
    if (!etapaActual) {
      console.error(
        `❌ Etapa actual no encontrada. id_producto_bancario=${simulacion.id_producto_bancario}, indice=${simulacion.etapa_actual_index}`
      );
      return res.status(500).json({
        ok: false,
        error: 'Etapa no encontrada',
        mensaje:
          'No se encontró la etapa actual de la simulación en el servidor. Verifica la configuración del producto y las etapas asociadas.',
      });
    }

    // ===============================================
    // 4️⃣ Obtener historial actual
    // ===============================================
    let historialConversacion = parsearJSON(
      simulacion.conversacion_asesoria,
      'conversacion_asesoria',
      []
    );

    console.log('📜 Historial actual:', historialConversacion.length, 'mensajes');

    // ===============================================
    // 5️⃣ Guardar mensaje del asesor en el historial
    // ===============================================
    const nuevoMensajeAsesor = {
      indiceEtapa: simulacion.etapa_actual_index,
      totalEtapas,
      nombreEtapa: etapaActual.nombre,
      objetivoEtapa: etapaActual.objetivo,
      emisor: 'Asesor',
      mensaje: mensaje.trim(),
      receptor: 'Cliente',
    };

    historialConversacion.push(nuevoMensajeAsesor);

    await pool.query(
      `UPDATE simulaciones
       SET conversacion_asesoria = ?, fecha_ultima_interaccion = CURRENT_TIMESTAMP
       WHERE id_simulacion = ?`,
      [JSON.stringify(historialConversacion), simulacion.id_simulacion]
    );

    // ===============================================
    // 6️⃣ Pedir respuesta a Gemini 🤖
    // ===============================================
    let respuestaCliente;
    try {
      respuestaCliente = await geminiService.generarMensajeCliente(
        producto,
        tipoClienteAleatorio,
        perfilClienteAleatorio,
        escenarioCliente,
        historialConversacion,
        etapaActual,
        {
          esPrimerMensaje: false,
          mensajeAsesor: mensaje.trim(),
        }
      );
    } catch (error) {
      console.error('❌ Error en Gemini:', error);
      return res.status(500).json({
        ok: false,
        error: 'Error IA',
        mensaje: 'Ocurrió un error al generar la respuesta del cliente con Gemini.',
        detalle: error.message,
      });
    }

    // ===============================================
    // 7️⃣ Guardar respuesta del cliente en la conversación
    // ===============================================
    const nuevoMensajeCliente = {
      indiceEtapa: simulacion.etapa_actual_index,
      totalEtapas,
      nombreEtapa: etapaActual.nombre,
      objetivoEtapa: etapaActual.objetivo,
      emisor: 'Cliente',
      mensaje: respuestaCliente.mensaje,
      receptor: 'Asesor',
    };

    historialConversacion.push(nuevoMensajeCliente);

    await pool.query(
      `UPDATE simulaciones
       SET conversacion_asesoria = ?, fecha_ultima_interaccion = CURRENT_TIMESTAMP
       WHERE id_simulacion = ?`,
      [JSON.stringify(historialConversacion), simulacion.id_simulacion]
    );

    // ===============================================
    // 🚨 7.1 DETENER SIMULACIÓN SI SE SALE DEL CONTEXTO
    // ===============================================
    if (respuestaCliente.finalizar_simulacion === true) {
      console.log('⚠️ La IA detectó salida de contexto. Finalizando simulación.');

      const duracionSegundos = calcularDuracionSegundos(simulacion.fecha_inicio);

      await pool.query(
        `UPDATE simulaciones
         SET estado = 'finalizada',
             tiempo_duracion_segundos = ?,
             fecha_finalizacion = CURRENT_TIMESTAMP
         WHERE id_simulacion = ?`,
        [duracionSegundos, simulacion.id_simulacion]
      );

      // 👈 NUEVO: Crear evidencia personal
      const evidenciaCreada = await crearEvidenciaPersonal(simulacion.id_simulacion, userId);

      return res.status(200).json({
        ok: true,
        simulacion_finalizada: true,
        motivo_finalizacion: 'salida_contexto',
        mensaje: 'Simulación finalizada: el asesor se salió del contexto.',
        id_simulacion: simulacion.id_simulacion,
        duracion_segundos: duracionSegundos,
        duracion_formato: formatearDuracion(duracionSegundos),
        evidencia: evidenciaCreada, // 👈 NUEVO
        mensajes: {
          asesor: nuevoMensajeAsesor,
          cliente: nuevoMensajeCliente,
        },
        historialActualizado: historialConversacion,
        etapa_cambiada: false,
        nueva_etapa: null,
        mensaje_nueva_etapa_cliente: null,
        analisis_desempeno: null,
      });
    }

    // ===============================================
    // 8️⃣ DETERMINAR SI SE AVANZA DE ETAPA
    // ===============================================
    const { debeAvanzar, mensajesEtapa, minimoMensajes } = debeAvanzarDeEtapa(
      etapaActual,
      historialConversacion
    );

    const esUltimaEtapa = simulacion.etapa_actual_index === totalEtapas;

    console.log('🔍 Etapa actual:', simulacion.etapa_actual_index);
    console.log('📊 Mensajes en etapa:', mensajesEtapa.length, '/', minimoMensajes);
    console.log('🔢 Total etapas:', totalEtapas);

    // ===============================================
    // 🆕 INICIALIZAR VARIABLES DE CONTROL
    // ===============================================
    let etapaCambiada = false;
    let mensajeNuevaEtapaCliente = null;
    let nuevaEtapaInfo = null;
    let simulacionFinalizada = false;
    let nuevoAnalisisAprendizaje = null;
    let analisisDesempeno = null;

    // ===============================================
    // 9️⃣ ÚLTIMA ETAPA COMPLETADA → FINALIZAR
    // ===============================================
    if (debeAvanzar && esUltimaEtapa) {
      console.log('🏁 Última etapa completada. Finalizando simulación...');

      const duracionSegundos = calcularDuracionSegundos(simulacion.fecha_inicio);

      // Generar análisis de desempeño antes de finalizar
      try {
        console.log('📊 Generando análisis de desempeño final...');

        const [todasLasEtapas] = await pool.query(
          'SELECT * FROM etapas_conversacion WHERE id_producto_bancario = ? ORDER BY numero_orden',
          [simulacion.id_producto_bancario]
        );

        analisisDesempeno = await geminiService.generarAnalisisDesempenoFinal(
          producto,
          tipoClienteAleatorio,
          perfilClienteAleatorio,
          escenarioCliente,
          historialConversacion,
          todasLasEtapas
        );

        console.log('✅ Análisis de desempeño generado correctamente');
      } catch (error) {
        console.error('❌ Error al generar análisis de desempeño:', error);
        analisisDesempeno = {
          error: true,
          mensaje: 'No se pudo generar el análisis automático',
          detalle: error.message,
        };
      }

      // Actualizar simulación como finalizada con análisis y duración
      await pool.query(
        `UPDATE simulaciones
         SET estado = 'finalizada',
             tiempo_duracion_segundos = ?,
             fecha_finalizacion = CURRENT_TIMESTAMP,
             analisis_desempeno = ?
         WHERE id_simulacion = ?`,
        [duracionSegundos, JSON.stringify(analisisDesempeno), simulacion.id_simulacion]
      );
      // 👈 NUEVO: Crear evidencia personal al finalizar por completar todas las etapas
      try {
        evidenciaCreada = await crearEvidenciaPersonal(simulacion.id_simulacion, userId);
      } catch (errEvid) {
        console.error('⚠️ Error creando evidencia en finalización automática:', errEvid);
      }

      simulacionFinalizada = true;
      console.log(`✅ Simulación ${simulacion.id_simulacion} finalizada correctamente`);
      console.log(`⏱️ Duración total: ${formatearDuracion(duracionSegundos)}`);
    } else if (debeAvanzar && simulacion.etapa_actual_index < totalEtapas) {
      // ===============================================
      // 🔟 AVANZAR A LA SIGUIENTE ETAPA
      // ===============================================
      const nuevoIndiceEtapa = simulacion.etapa_actual_index + 1;

      const [[siguienteEtapa]] = await pool.query(
        `SELECT * FROM etapas_conversacion
         WHERE id_producto_bancario = ? AND numero_orden = ? LIMIT 1`,
        [simulacion.id_producto_bancario, nuevoIndiceEtapa]
      );

      if (siguienteEtapa) {
        await pool.query(
          `UPDATE simulaciones
           SET etapa_actual_index = ?, fecha_ultima_interaccion = CURRENT_TIMESTAMP
           WHERE id_simulacion = ?`,
          [nuevoIndiceEtapa, simulacion.id_simulacion]
        );

        etapaCambiada = true;
        nuevaEtapaInfo = siguienteEtapa;
        console.log(`➡️ Avanzando a etapa ${nuevoIndiceEtapa}: ${siguienteEtapa.nombre}`);

        // ===============================================
        // 🔟.1️⃣ GENERAR ANÁLISIS DE APRENDIZAJE PARA LA NUEVA ETAPA 📚
        // ===============================================
        if (simulacion.modo === 'aprendizaje') {
          try {
            console.log(`🎓 Generando análisis de aprendizaje para etapa ${nuevoIndiceEtapa}...`);

            const resultadoAnalisis =
              await geminiService.generarAnalisisSimulacionPorEtapaModoAprendizaje(
                producto,
                tipoClienteAleatorio,
                perfilClienteAleatorio,
                escenarioCliente,
                historialConversacion,
                siguienteEtapa
              );

            nuevoAnalisisAprendizaje = {
              indiceEtapa: nuevoIndiceEtapa,
              nombreEtapa: siguienteEtapa.nombre,
              objetivoEtapa: siguienteEtapa.objetivo,
              recomendacionParaAsesor: resultadoAnalisis.recomendaciones_aprendizaje,
            };

            // Obtener análisis previos y agregar el nuevo
            let analisisPrevios = parsearJSON(
              simulacion.recomendaciones_aprendizaje_ia,
              'recomendaciones_aprendizaje_ia',
              []
            );

            analisisPrevios.push(nuevoAnalisisAprendizaje);

            // Guardar todos los análisis
            await pool.query(
              'UPDATE simulaciones SET recomendaciones_aprendizaje_ia = ? WHERE id_simulacion = ?',
              [JSON.stringify(analisisPrevios), simulacion.id_simulacion]
            );

            console.log('✅ Análisis de aprendizaje guardado para nueva etapa');
          } catch (error) {
            console.error('❌ Error al generar análisis de aprendizaje:', error);
            // No detener el flujo si falla el análisis
          }
        }

        // ===============================================
        // 🔟.2️⃣ GENERAR PRIMER MENSAJE SI EL CLIENTE INICIA
        // ===============================================
        if (siguienteEtapa.quien_inicia === 'Cliente') {
          try {
            const primerMensajeNuevaEtapa = await geminiService.generarMensajeCliente(
              producto,
              tipoClienteAleatorio,
              perfilClienteAleatorio,
              escenarioCliente,
              historialConversacion,
              siguienteEtapa,
              { esPrimerMensaje: true }
            );

            const mensajeClienteNuevaEtapa = {
              indiceEtapa: nuevoIndiceEtapa,
              totalEtapas,
              nombreEtapa: siguienteEtapa.nombre,
              objetivoEtapa: siguienteEtapa.objetivo,
              emisor: 'Cliente',
              mensaje: primerMensajeNuevaEtapa.mensaje,
              receptor: 'Asesor',
            };

            historialConversacion.push(mensajeClienteNuevaEtapa);

            await pool.query(
              `UPDATE simulaciones
               SET conversacion_asesoria = ?, fecha_ultima_interaccion = CURRENT_TIMESTAMP
               WHERE id_simulacion = ?`,
              [JSON.stringify(historialConversacion), simulacion.id_simulacion]
            );

            mensajeNuevaEtapaCliente = mensajeClienteNuevaEtapa;
          } catch (error) {
            console.error('❌ Error al generar primer mensaje de nueva etapa:', error);
          }
        }
      }
    }

    // ===============================================
    // 1️⃣1️⃣ Respuesta final al frontend
    // ===============================================
    const respuestaFinal = {
      ok: true,
      mensaje: simulacionFinalizada
        ? 'Simulación finalizada correctamente.'
        : 'Mensaje procesado correctamente.',
      id_simulacion: simulacion.id_simulacion,
      mensajes: {
        asesor: nuevoMensajeAsesor,
        cliente: nuevoMensajeCliente,
      },
      historialActualizado: historialConversacion,
      simulacion_finalizada: simulacionFinalizada,
      etapa_cambiada: etapaCambiada,
      nueva_etapa: etapaCambiada ? nuevaEtapaInfo : null,
      mensaje_nueva_etapa_cliente: mensajeNuevaEtapaCliente,
      analisis_aprendizaje: nuevoAnalisisAprendizaje,
      analisis_desempeno: analisisDesempeno,
      evidencia_creada: evidenciaCreada,
    };

    // Agregar información de duración solo si la simulación finalizó
    if (simulacionFinalizada) {
      const duracionSegundos = calcularDuracionSegundos(simulacion.fecha_inicio);
      respuestaFinal.duracion_segundos = duracionSegundos;
      respuestaFinal.duracion_formato = formatearDuracion(duracionSegundos);
      respuestaFinal.etapas_completadas = simulacion.etapa_actual_index;
      respuestaFinal.total_etapas = totalEtapas;
    }

    return res.status(200).json(respuestaFinal);
  } catch (error) {
    console.error('❌ Error al enviar mensaje:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno',
      mensaje: 'Error interno al enviar el mensaje.',
      detalle: error.message,
    });
  }
};

/**
 * GET /api/simulacion/estado
 * Obtiene el estado actual de la simulación del usuario autenticado
 */
exports.obtenerEstado = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;

    // Buscar simulación en proceso
    const [simulaciones] = await pool.query(
      'SELECT id_simulacion FROM simulaciones WHERE id_aprendiz = ? AND estado = ? LIMIT 1',
      [userId, 'en_proceso']
    );

    const simulacion = simulaciones[0];

    if (!simulacion) {
      return res.status(404).json({
        ok: false,
        error: 'Simulación no encontrada',
        mensaje: 'No existe una simulación activa para este usuario',
        accion: 'Inicie una nueva simulación con POST /api/simulacion/iniciar',
      });
    }

    // 🎯 Usar la función auxiliar para obtener el estado completo
    const estadoCompleto = await obtenerEstadoCompleto(simulacion.id_simulacion);

    return res.status(200).json({
      ok: true,
      mensaje: 'Estado de la simulación obtenido correctamente',
      ...estadoCompleto,
    });
  } catch (err) {
    console.error('Error en obtenerEstado:', err);
    return res.status(500).json({
      ok: false,
      error: 'Error al obtener estado',
      mensaje: 'Error interno al obtener el estado de la simulación',
      detalle: err.message,
    });
  }
};

/**
 * POST /api/simulacion/finalizar
 * Finaliza la simulación actual sin generar análisis de desempeño
 */
exports.finalizarSimulacion = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;

    // Buscar simulación en proceso
    const [simulaciones] = await pool.query(
      'SELECT * FROM simulaciones WHERE id_aprendiz = ? AND estado = ? LIMIT 1',
      [userId, 'en_proceso']
    );

    const simulacion = simulaciones[0];

    if (!simulacion) {
      return res.status(404).json({
        ok: false,
        error: 'Simulación no encontrada',
        mensaje: 'No existe una simulación activa para finalizar',
      });
    }

    // Calcular duración total en segundos
    const duracionSegundos = calcularDuracionSegundos(simulacion.fecha_inicio);

    // Obtener información del producto
    const [[producto]] = await pool.query(
      'SELECT nombre FROM productos_bancarios WHERE id_producto_bancario = ?',
      [simulacion.id_producto_bancario]
    );

    // Obtener total de etapas del producto
    const [[{ total: totalEtapas }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM etapas_conversacion WHERE id_producto_bancario = ?',
      [simulacion.id_producto_bancario]
    );

    // Parsear historial de conversación
    const historialConversacion = parsearJSON(
      simulacion.conversacion_asesoria,
      'conversacion_asesoria',
      []
    );

    // Actualizar simulación como finalizada con duración
    await pool.query(
      `UPDATE simulaciones
       SET estado = 'finalizada',
           tiempo_duracion_segundos = ?,
           fecha_finalizacion = CURRENT_TIMESTAMP
       WHERE id_simulacion = ?`,
      [duracionSegundos, simulacion.id_simulacion]
    );

    // 👈 NUEVO: Crear evidencia personal al finalizar manualmente
    let evidenciaCreada = null;
    try {
      evidenciaCreada = await crearEvidenciaPersonal(simulacion.id_simulacion, userId);
    } catch (errEvid) {
      console.error('⚠️ Error creando evidencia en finalización manual:', errEvid);
    }

    // Determinar si completó todas las etapas
    const simulacionCompletada = simulacion.etapa_actual_index >= totalEtapas;

    console.log(`✅ Simulación ${simulacion.id_simulacion} finalizada manualmente por el usuario`);
    console.log(`⏱️ Duración total: ${formatearDuracion(duracionSegundos)}`);

    return res.status(200).json({
      ok: true,
      mensaje: 'Simulación finalizada correctamente',
      evidencia: evidenciaCreada,
      simulacion: {
        id_simulacion: simulacion.id_simulacion,
        producto: producto.nombre,
        modo: simulacion.modo,
        duracion_segundos: duracionSegundos,
        duracion_formato: formatearDuracion(duracionSegundos),
        etapas_completadas: simulacion.etapa_actual_index,
        total_etapas: totalEtapas,
        simulacion_completada: simulacionCompletada,
        total_mensajes: historialConversacion.length,
        fecha_inicio: simulacion.fecha_inicio,
        fecha_finalizacion: new Date(),
      },
      historial: historialConversacion,
    });
  } catch (err) {
    console.error('Error en finalizarSimulacion:', err);

    return res.status(500).json({
      ok: false,
      error: 'Error al finalizar simulación',
      mensaje: 'Error interno al finalizar la simulación',
      detalle: err.message,
    });
  }
};
