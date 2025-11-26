const { pool } = require('../config/database.config');

/**
 * Obtiene todos los logros y los que ya tiene el aprendiz
 */
async function obtenerLogrosYAsignados(idAprendiz) {
  const [logros] = await pool.query('SELECT * FROM logros');

  const [asignados] = await pool.query(
    'SELECT id_logro FROM aprendices_logros WHERE id_aprendiz = ?',
    [idAprendiz]
  );

  const idsAsignados = new Set(asignados.map((r) => r.id_logro));

  return {
    logros,
    idsAsignados,
  };
}

/**
 * Evalúa una condición simple tipo "conteo >= valor"
 */
function cumpleComparacion(actual, operador, esperado) {
  switch (operador) {
    case '>=':
      return actual >= esperado;
    case '>':
      return actual > esperado;
    case '<=':
      return actual <= esperado;
    case '<':
      return actual < esperado;
    case '===':
      return actual === esperado;
    case '!==':
      return actual !== esperado;
    default:
      return false;
  }
}

/**
 * Calcula métricas generales de simulaciones de un aprendiz
 * para poder evaluar logros.
 */
async function obtenerMetricasSimulaciones(idAprendiz) {
  const [[{ total: totalFinalizadas }]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM simulaciones
     WHERE id_aprendiz = ? AND estado = 'finalizada'`,
    [idAprendiz]
  );

  const [[{ total: totalEvaluativasFinalizadas }]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM simulaciones
     WHERE id_aprendiz = ? AND estado = 'finalizada' AND modo = 'evaluativo'`,
    [idAprendiz]
  );

  const [productosUsados] = await pool.query(
    `SELECT DISTINCT id_producto_bancario
     FROM simulaciones
     WHERE id_aprendiz = ? AND estado = 'finalizada'`,
    [idAprendiz]
  );

  const [[{ total: totalProductos }]] = await pool.query(
    'SELECT COUNT(*) AS total FROM productos_bancarios'
  );

  const [modosUsados] = await pool.query(
    `SELECT DISTINCT modo
     FROM simulaciones
     WHERE id_aprendiz = ? AND estado = 'finalizada'`,
    [idAprendiz]
  );

  return {
    totalFinalizadas,
    totalEvaluativasFinalizadas,
    productosUsados: productosUsados.map((r) => r.id_producto_bancario),
    totalProductos: totalProductos || 0,
    modosUsados: modosUsados.map((r) => r.modo),
  };
}

/**
 * Evalúa si el aprendiz cumple los criterios de un logro concreto.
 */
function evaluarCriteriosLogro(logro, metricas) {
  let criterios = logro.criterios_desbloqueo;

  if (!criterios) return false;

  if (typeof criterios === 'string') {
    try {
      criterios = JSON.parse(criterios);
    } catch (e) {
      console.error('Error parseando criterios_desbloqueo para logro', logro.id_logro, e);
      return false;
    }
  }

  if (!Array.isArray(criterios)) {
    criterios = [criterios];
  }

  return criterios.every((criterio) => {
    switch (criterio.tipo) {
      case 'conteo_simulaciones': {
        const esEvaluativas = criterio.filtros?.modo === 'evaluativo';
        const total = esEvaluativas
          ? metricas.totalEvaluativasFinalizadas
          : metricas.totalFinalizadas;
        return cumpleComparacion(total, criterio.operador, criterio.valor);
      }

      case 'productos_cubiertos': {
        const usados = new Set(metricas.productosUsados);
        if (criterio.valor === 'TODOS_PRODUCTOS') {
          return usados.size === metricas.totalProductos && metricas.totalProductos > 0;
        }
        return false;
      }

      case 'modos_cubiertos': {
        const usados = new Set(metricas.modosUsados);
        const requeridos = Array.isArray(criterio.valor) ? criterio.valor : [criterio.valor];
        return requeridos.every((m) => usados.has(m));
      }

      case 'todos_logros_previos': {
        // Este tipo se gestiona de forma especial fuera
        // Para evitar que el logro maestro se asigne en el bucle general
        return false;
      }

      default:
        return false;
    }
  });
}

/**
 * Dado un aprendiz y una simulación que acaba de pasar a estado `finalizada`,
 * revisa todos los logros y asigna los que correspondan.
 */
async function evaluarYAsignarLogrosPorFinalizacion(idAprendiz) {
  const { logros, idsAsignados } = await obtenerLogrosYAsignados(idAprendiz);
  const idsIniciales = new Set(idsAsignados);

  if (!logros || logros.length === 0) {
    return [];
  }

  const metricas = await obtenerMetricasSimulaciones(idAprendiz);
  const nuevosLogros = [];

  // Identificar el logro maestro ("Completa todos los Logros") si existe
  const logroMaestro = logros.find((l) => l.nombre === 'Completa todos los Logros');

  // 1) Asignar todos los logros normales (EXCLUYENDO el maestro)
  for (const logro of logros) {
    // Saltar el logro maestro en el bucle general
    if (logroMaestro && logro.id_logro === logroMaestro.id_logro) {
      continue;
    }

    if (idsAsignados.has(logro.id_logro)) {
      continue;
    }

    try {
      if (typeof logro.criterios_desbloqueo === 'string') {
        logro.criterios_desbloqueo = JSON.parse(logro.criterios_desbloqueo);
      }
    } catch (err) {
      console.error('Error parseando criterios_desbloqueo de logro', logro.id_logro, err);
      continue;
    }

    const cumple = evaluarCriteriosLogro(logro, metricas);

    if (cumple) {
      await pool.query('INSERT INTO aprendices_logros (id_aprendiz, id_logro) VALUES (?, ?)', [
        idAprendiz,
        logro.id_logro,
      ]);

      nuevosLogros.push({
        id_logro: logro.id_logro,
        nombre: logro.nombre,
        descripcion: logro.descripcion,
        imagen: logro.imagen,
      });

      idsAsignados.add(logro.id_logro);
    }
  }

  // 2) Lógica especial para "Completa todos los Logros"
  if (logroMaestro) {
    if (!idsIniciales.has(logroMaestro.id_logro)) {
      const idsLogrosNormales = logros
        .filter((l) => l.id_logro !== logroMaestro.id_logro)
        .map((l) => l.id_logro);

      if (idsLogrosNormales.length > 0) {
        const conjuntoFinal = new Set([
          ...Array.from(idsIniciales).filter((id) => id !== logroMaestro.id_logro),
          ...nuevosLogros.map((l) => l.id_logro),
        ]);

        // 🔍 DEBUG
        console.log('==== DEBUG LOGROS MAESTRO ====');
        console.log('idsIniciales:', Array.from(idsIniciales));
        console.log(
          'nuevosLogros:',
          nuevosLogros.map((l) => l.id_logro)
        );
        console.log('idsLogrosNormales:', idsLogrosNormales);
        console.log('conjuntoFinal:', Array.from(conjuntoFinal));
        const tieneTodosLosNormales = idsLogrosNormales.every((id) => conjuntoFinal.has(id));
        console.log('tieneTodosLosNormales:', tieneTodosLosNormales);
        console.log('===============================');

        if (tieneTodosLosNormales) {
          await pool.query('INSERT INTO aprendices_logros (id_aprendiz, id_logro) VALUES (?, ?)', [
            idAprendiz,
            logroMaestro.id_logro,
          ]);

          nuevosLogros.push({
            id_logro: logroMaestro.id_logro,
            nombre: logroMaestro.nombre,
            descripcion: logroMaestro.descripcion,
            imagen: logroMaestro.imagen,
          });
        }
      }
    }
  }

  return nuevosLogros;
}

module.exports = {
  evaluarYAsignarLogrosPorFinalizacion,
};
