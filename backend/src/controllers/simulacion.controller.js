const { pool } = require('../config/database.config');
const geminiService = require('../services/gemini');
const fetch = require('node-fetch');

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
        sonido_habilitado,
        perfil_cliente,
        aspectos_clave_registrados,
        conversacion_asesoria,
        estado,
        etapa_actual_index
      )
      VALUES (?, ?, 'especifico', ?, ?, ?, '{}', '[]', '[]', 'en_proceso', 1)`,
      [userId, producto.id_producto_bancario, modo, destino, interaccion !== 'silenciado']
    );

    const idNuevaSimulacion = result.insertId;

    // =====================================================
    // 7️⃣ Guardar cliente simulado
    // =====================================================
    await pool.query(
      `INSERT INTO clientes_simulados (
        id_simulacion,
        genero,
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
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idNuevaSimulacion,
        escenarioCliente.genero,
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
        // 🎯 USANDO LA NUEVA FUNCIÓN COMBINADA CON esPrimerMensaje: true
        mensajeInicialCliente = await geminiService.generarMensajeCliente(
          producto,
          tipoClienteAleatorio,
          perfilClienteAleatorio,
          escenarioCliente,
          [], // historial vacío
          etapaActual,
          { esPrimerMensaje: true } // 👈 Activar lógica de primer mensaje
        );

        const [totalEtapasResult] = await pool.query(
          'SELECT COUNT(*) as total FROM etapas_conversacion WHERE id_producto_bancario = ?',
          [producto.id_producto_bancario]
        );
        const totalEtapas = totalEtapasResult[0].total;

        // Crear el primer mensaje como objeto individual
        const primerMensaje = {
          indiceEtapa: 1,
          totalEtapas: totalEtapas,
          nombreEtapa: etapaActual.nombre,
          objetivoEtapa: etapaActual.objetivo,
          emisor: 'Cliente',
          mensaje: mensajeInicialCliente.mensaje,
          receptor: 'Asesor',
        };

        // Guardar como array con un solo elemento
        await pool.query(
          'UPDATE simulaciones SET conversacion_asesoria = ? WHERE id_simulacion = ?',
          [JSON.stringify([primerMensaje]), idNuevaSimulacion]
        );
      } catch (error) {
        console.error('Error al generar primer mensaje del cliente:', error);
      }
    }

    // =====================================================
    // 9️⃣ Respuesta final al frontend
    // =====================================================
    return res.status(201).json({
      ok: true,
      mensaje: 'Simulación iniciada correctamente.',
      id_simulacion: idNuevaSimulacion,
      producto,
      tipo_cliente: tipoClienteAleatorio,
      perfil_cliente: perfilClienteAleatorio,
      escenario_cliente: escenarioCliente,
      etapa_inicial: etapaActual || null,
      primer_mensaje_cliente: mensajeInicialCliente || null,
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
 * Envía un mensaje del asesor (usuario) y recibe respuesta del cliente (IA)
 *
 * Body esperado:
 * {
 *   mensaje: "Cordial saludo, señor Sebastián..."
 * }
 *
 * El userId se obtiene del token JWT (req.user.id)
 */
// ============================================================
// HELPER: determina si se debe avanzar de etapa
// ============================================================
function debeAvanzarDeEtapa(etapaActual, historialConversacion) {
  const mensajesEtapa = historialConversacion.filter(
    (m) => m.indiceEtapa === etapaActual.numero_orden
  );

  // cuando la etapa la inicia el cliente → 3 mensajes
  // cuando la etapa la inicia el asesor → 2 mensajes
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

    const [[{ total: totalEtapas }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM etapas_conversacion WHERE id_producto_bancario = ?',
      [producto.id_producto_bancario]
    );

    // ===============================================
    // 4️⃣ Obtener historial actual
    // ===============================================
    let historialConversacion = [];
    try {
      let conversacionRaw = simulacion.conversacion_asesoria;

      if (Buffer.isBuffer(conversacionRaw)) {
        conversacionRaw = conversacionRaw.toString('utf8');
      }

      if (typeof conversacionRaw === 'string' && conversacionRaw.trim() !== '') {
        historialConversacion = JSON.parse(conversacionRaw);
      } else if (Array.isArray(conversacionRaw)) {
        historialConversacion = conversacionRaw;
      } else {
        historialConversacion = [];
      }
    } catch (err) {
      console.error('❌ Error parseando conversacion_asesoria:', err);
      historialConversacion = [];
    }

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
      // 🎯 USANDO LA NUEVA FUNCIÓN COMBINADA CON mensajeAsesor
      respuestaCliente = await geminiService.generarMensajeCliente(
        producto,
        tipoClienteAleatorio,
        perfilClienteAleatorio,
        escenarioCliente,
        historialConversacion,
        etapaActual,
        {
          esPrimerMensaje: false, // 👈 NO es primer mensaje
          mensajeAsesor: mensaje.trim(), // 👈 Mensaje del asesor para responder
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
    // 8️⃣ DETERMINAR SI SE AVANZA DE ETAPA
    // ===============================================
    const { debeAvanzar, mensajesEtapa, minimoMensajes } = debeAvanzarDeEtapa(
      etapaActual,
      historialConversacion
    );

    const esUltimaEtapa = simulacion.etapa_actual_index === totalEtapas;

    console.log('🔍 Etapa actual:', simulacion.etapa_actual_index);
    console.log('📊 Mensajes en etapa:', mensajesEtapa.length, '/', minimoMensajes);
    console.log('🏁 Total etapas:', totalEtapas);

    let etapaCambiada = false;
    let mensajeNuevaEtapaCliente = null;
    let nuevaEtapaInfo = null;
    let simulacionFinalizada = false;

    if (debeAvanzar && esUltimaEtapa) {
      // ===============================================
      // 9️⃣ FINALIZAR SIMULACIÓN (última etapa completada)
      // ===============================================
      await pool.query(
        `UPDATE simulaciones
         SET estado = 'finalizada',
             fecha_finalizacion = CURRENT_TIMESTAMP
         WHERE id_simulacion = ?`,
        [simulacion.id_simulacion]
      );

      simulacionFinalizada = true;
      console.log(`✅ Simulación ${simulacion.id_simulacion} finalizada correctamente`);
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

        if (siguienteEtapa.quien_inicia === 'Cliente') {
          try {
            // 🎯 USANDO LA NUEVA FUNCIÓN COMBINADA PARA NUEVA ETAPA
            const primerMensajeNuevaEtapa = await geminiService.generarMensajeCliente(
              producto,
              tipoClienteAleatorio,
              perfilClienteAleatorio,
              escenarioCliente,
              historialConversacion,
              siguienteEtapa,
              { esPrimerMensaje: true } // 👈 Es primer mensaje de nueva etapa
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
    return res.status(200).json({
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
    });
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

// ===============================================
// 4️⃣ (Lógica posterior)
// Aquí ya puedes:
//  - Guardar el mensaje del asesor
//  - Pedir respuesta IA con geminiService
//  - Actualizar conversacion_asesoria
// ===============================================

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
