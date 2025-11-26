// Definición de logros basada en la estructura de la BD
// Tabla: logros (campo condicion_tipo)
//   - 'simulaciones_completadas'
//   - 'simulaciones_evaluativas'
//   - 'simulaciones_agrupadas'

const LOGROS = {
  // ===============================
  // Simulaciones completas (cualquier modo)
  // ===============================
  '5 Simulaciones Completas': {
    imagen: 'images/logros/5_simulaciones_completas.svg',
    descripcion: 'Completa 5 simulaciones en la plataforma.',
    condicion_tipo: 'simulaciones_completadas',
    criterios_desbloqueo: [
      {
        // Cuenta todas las simulaciones finalizadas del aprendiz
        tipo: 'conteo_simulaciones',
        filtros: {
          estado: 'finalizada',
        },
        operador: '>=',
        valor: 5,
      },
    ],
  },

  '10 Simulaciones Completas': {
    imagen: 'images/logros/10_simulaciones_completas.svg',
    descripcion: 'Completa 10 simulaciones en la plataforma.',
    condicion_tipo: 'simulaciones_completadas',
    criterios_desbloqueo: [
      {
        tipo: 'conteo_simulaciones',
        filtros: {
          estado: 'finalizada',
        },
        operador: '>=',
        valor: 10,
      },
    ],
  },

  '25 Simulaciones Completas': {
    imagen: 'images/logros/25_simulaciones_completas.svg',
    descripcion: 'Completa 25 simulaciones en la plataforma.',
    condicion_tipo: 'simulaciones_completadas',
    criterios_desbloqueo: [
      {
        tipo: 'conteo_simulaciones',
        filtros: {
          estado: 'finalizada',
        },
        operador: '>=',
        valor: 25,
      },
    ],
  },

  // ===============================
  // Simulaciones evaluativas completas
  // ===============================
  '5 Simulaciones Evaluativas': {
    imagen: 'images/logros/5_simulaciones_evaluativas.svg',
    descripcion: 'Completa 5 simulaciones evaluativas.',
    condicion_tipo: 'simulaciones_evaluativas',
    criterios_desbloqueo: [
      {
        tipo: 'conteo_simulaciones',
        filtros: {
          estado: 'finalizada',
          modo: 'evaluativo',
        },
        operador: '>=',
        valor: 5,
      },
    ],
  },

  '10 Simulaciones Evaluativas': {
    imagen: 'images/logros/10_simulaciones_evaluativas.svg',
    descripcion: 'Completa 10 simulaciones evaluativas.',
    condicion_tipo: 'simulaciones_evaluativas',
    criterios_desbloqueo: [
      {
        tipo: 'conteo_simulaciones',
        filtros: {
          estado: 'finalizada',
          modo: 'evaluativo',
        },
        operador: '>=',
        valor: 10,
      },
    ],
  },

  '25 Simulaciones Evaluativas': {
    imagen: 'images/logros/25_simulaciones_evaluativas.svg',
    descripcion: 'Completa 25 simulaciones evaluativas.',
    condicion_tipo: 'simulaciones_evaluativas',
    criterios_desbloqueo: [
      {
        tipo: 'conteo_simulaciones',
        filtros: {
          estado: 'finalizada',
          modo: 'evaluativo',
        },
        operador: '>=',
        valor: 25,
      },
    ],
  },

  // ===============================
  // Logros "agrupados" que dependen de varias simulaciones
  // ===============================
  'Prueba todos los productos y los modos': {
    imagen: 'images/logros/prueba_todos_los_productos_y_los_modos.svg',
    descripcion: 'Interacciona con todos los productos y modos disponibles en las simulaciones.',
    condicion_tipo: 'simulaciones_agrupadas',
    criterios_desbloqueo: [
      {
        // Ha usado todos los productos en al menos una simulación finalizada
        tipo: 'productos_cubiertos',
        filtros: {
          estado: 'finalizada',
        },
        operador: '===',
        valor: 'TODOS_PRODUCTOS',
      },
      {
        // Ha usado ambos modos (aprendizaje y evaluativo)
        tipo: 'modos_cubiertos',
        filtros: {
          estado: 'finalizada',
        },
        operador: '===',
        valor: ['aprendizaje', 'evaluativo'],
      },
    ],
  },

  'Completa todos los Logros': {
    imagen: 'images/logros/completa_todos_los_logros.svg',
    descripcion: 'Desbloquea todos los logros disponibles en la plataforma.',
    condicion_tipo: 'simulaciones_agrupadas',
    criterios_desbloqueo: [
      {
        tipo: 'todos_logros_previos',
        operador: '===',
        valor: true,
      },
    ],
  },
};

module.exports = LOGROS;
