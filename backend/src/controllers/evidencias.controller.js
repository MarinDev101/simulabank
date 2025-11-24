const { pool } = require('../config/database.config');
const pdfService = require('../services/pdf');

/**
 * Parsea JSON de la base de datos de forma segura
 */
function parsearJSON(data, valorPorDefecto = []) {
  try {
    if (Buffer.isBuffer(data)) data = data.toString('utf8');
    if (Array.isArray(data)) return data;
    if (typeof data === 'string' && data.trim() !== '') return JSON.parse(data);
    if (typeof data === 'object' && data !== null) return data;
    return valorPorDefecto;
  } catch (err) {
    console.error('Error parseando JSON:', err);
    return valorPorDefecto;
  }
}

/**
 * Formatea duración en segundos a formato legible
 */
function formatearDuracion(segundos) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * Obtiene toda la información de una simulación para el PDF
 */
async function obtenerDatosCompletosSimulacion(idSimulacion, idAprendiz) {
  // 1. Simulación principal
  const [[simulacion]] = await pool.query(
    `SELECT s.* FROM simulaciones s
     INNER JOIN evidencias_personales ep ON ep.id_simulacion = s.id_simulacion
     WHERE s.id_simulacion = ? AND s.id_aprendiz = ? AND s.estado = 'finalizada'`,
    [idSimulacion, idAprendiz]
  );

  if (!simulacion) return null;

  // 2. Usuario/Aprendiz
  const [[usuario]] = await pool.query(
    `SELECT u.id_usuario, u.correo_electronico, u.nombres, u.apellidos, u.foto_perfil
     FROM usuarios u WHERE u.id_usuario = ?`,
    [idAprendiz]
  );

  // 3. Producto bancario
  const [[producto]] = await pool.query(
    'SELECT * FROM productos_bancarios WHERE id_producto_bancario = ?',
    [simulacion.id_producto_bancario]
  );

  // 4. Cliente simulado
  const [[clienteSimulado]] = await pool.query(
    'SELECT * FROM clientes_simulados WHERE id_simulacion = ?',
    [idSimulacion]
  );

  // 5. Tipo de cliente
  const [[tipoCliente]] = await pool.query(
    'SELECT * FROM tipos_clientes WHERE id_tipo_cliente = ?',
    [clienteSimulado?.id_tipo_cliente]
  );

  // 6. Perfil de cliente
  const [[perfilCliente]] = await pool.query(
    'SELECT * FROM perfiles_clientes WHERE id_perfil_cliente = ?',
    [clienteSimulado?.id_perfil_cliente]
  );

  // 7. Todas las etapas del producto
  const [etapas] = await pool.query(
    `SELECT * FROM etapas_conversacion
     WHERE id_producto_bancario = ? ORDER BY numero_orden`,
    [simulacion.id_producto_bancario]
  );

  // 8. Evidencia personal
  const [[evidencia]] = await pool.query(
    'SELECT * FROM evidencias_personales WHERE id_simulacion = ?',
    [idSimulacion]
  );

  // 9. Carpeta (si existe)
  let carpeta = null;
  if (evidencia?.id_carpeta_personal) {
    const [[carp]] = await pool.query(
      'SELECT * FROM carpetas_personales WHERE id_carpeta_personal = ?',
      [evidencia.id_carpeta_personal]
    );
    carpeta = carp;
  }

  // Parsear campos JSON
  const conversacion = parsearJSON(simulacion.conversacion_asesoria, []);
  const recomendaciones = parsearJSON(simulacion.recomendaciones_aprendizaje_ia, []);
  const aspectosClave = parsearJSON(simulacion.aspectos_clave_registrados, []);
  const analisisDesempeno = parsearJSON(simulacion.analisis_desempeno, null);
  const caracteristicas = parsearJSON(producto?.caracteristicas, []);
  const beneficios = parsearJSON(producto?.beneficios, []);
  const requisitos = parsearJSON(producto?.requisitos, []);

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
      caracteristicas,
      beneficios,
      requisitos,
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
    conversacion,
    recomendaciones,
    aspectosClave,
    analisisDesempeno,
    evidencia: {
      numeroEvidencia: evidencia?.numero_evidencia,
      fechaAgregado: evidencia?.fecha_agregado,
      estado: evidencia?.estado,
      carpeta: carpeta?.nombre || 'Sin carpeta',
    },
  };
}

class EvidenciasController {
  async listarEvidencias(req, res) {
    try {
      const userId = req.user.id || req.user.userId;

      const [evidencias] = await pool.query(
        `SELECT ep.*, s.modo, s.tiempo_duracion_segundos,
              pb.nombre as producto_nombre, cp.nombre as carpeta_nombre
          FROM evidencias_personales ep
          INNER JOIN simulaciones s ON s.id_simulacion = ep.id_simulacion
          INNER JOIN productos_bancarios pb ON pb.id_producto_bancario = s.id_producto_bancario
          LEFT JOIN carpetas_personales cp ON cp.id_carpeta_personal = ep.id_carpeta_personal
          WHERE s.id_aprendiz = ?
          ORDER BY ep.fecha_agregado DESC`,
        [userId]
      );

      // Añadir `nombreSugerido` a cada evidencia (basado en numero_evidencia, fallback a id_simulacion)
      const evidenciasConNombre = evidencias.map((e) => {
        const numero = e.numero_evidencia ?? e.id_simulacion;
        return {
          ...e,
          nombreSugerido: `evidencia_${numero}.pdf`,
        };
      });

      return res.json({ ok: true, evidencias: evidenciasConNombre });
    } catch (err) {
      console.error('Error listando evidencias:', err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  async verEvidencia(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const { id_simulacion } = req.params;

      if (!id_simulacion) {
        return res.status(400).json({ ok: false, error: 'id_simulacion requerido' });
      }

      const datos = await obtenerDatosCompletosSimulacion(id_simulacion, userId);

      if (!datos) {
        return res.status(404).json({ ok: false, error: 'Evidencia no encontrada' });
      }

      const { buffer } = await pdfService.generarPdfEvidencia(datos, false);

      const base64 = buffer.toString('base64');

      return res.json({
        ok: true,
        pdfBase64: base64,
        nombreSugerido: `evidencia_${datos.evidencia?.numeroEvidencia ?? id_simulacion}.pdf`,
      });
    } catch (err) {
      console.error('Error viendo evidencia:', err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  async descargarEvidencia(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const { id_simulacion } = req.params;

      if (!id_simulacion) {
        return res.status(400).json({ ok: false, error: 'id_simulacion requerido' });
      }

      // Obtener todos los datos de la simulación
      const datos = await obtenerDatosCompletosSimulacion(id_simulacion, userId);

      if (!datos) {
        return res.status(404).json({ ok: false, error: 'Evidencia no encontrada' });
      }

      // Generar PDF con todos los datos (obtenerPeso = false para obtener buffer)
      const { buffer, pesoKb } = await pdfService.generarPdfEvidencia(datos, false);

      // Actualizar peso en BD si cambió
      await pool.query('UPDATE evidencias_personales SET peso_pdf_kb = ? WHERE id_simulacion = ?', [
        pesoKb,
        id_simulacion,
      ]);

      // Nombre del archivo: usar numero_evidencia si está disponible, si no fallback a id_simulacion
      const nombreArchivo = `evidencia_${datos.evidencia?.numeroEvidencia ?? id_simulacion}.pdf`;

      // Enviar PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
      res.setHeader('Content-Length', buffer.length);

      return res.send(buffer);
    } catch (err) {
      console.error('Error descargando evidencia:', err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  async archivarEvidencia(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const { id_simulacion } = req.body;

      await pool.query(
        `UPDATE evidencias_personales ep
         INNER JOIN simulaciones s ON s.id_simulacion = ep.id_simulacion
         SET ep.estado = 'archivada'
         WHERE ep.id_simulacion = ? AND s.id_aprendiz = ?`,
        [id_simulacion, userId]
      );

      return res.json({ ok: true, mensaje: 'Evidencia archivada' });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  async desarchivarEvidencia(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const { id_simulacion } = req.body;

      await pool.query(
        `UPDATE evidencias_personales ep
         INNER JOIN simulaciones s ON s.id_simulacion = ep.id_simulacion
         SET ep.estado = 'visible'
         WHERE ep.id_simulacion = ? AND s.id_aprendiz = ?`,
        [id_simulacion, userId]
      );

      return res.json({ ok: true, mensaje: 'Evidencia desarchivada' });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  async eliminarEvidencia(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const { id_simulacion } = req.params;

      await pool.query(
        `DELETE ep FROM evidencias_personales ep
         INNER JOIN simulaciones s ON s.id_simulacion = ep.id_simulacion
         WHERE ep.id_simulacion = ? AND s.id_aprendiz = ?`,
        [id_simulacion, userId]
      );

      return res.json({ ok: true, mensaje: 'Evidencia eliminada' });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }
}

module.exports = new EvidenciasController();
