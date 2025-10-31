const PRODUCTOS_FINANCIEROS = {
  'Cuenta de Ahorros': {
    tipo: 'Producto de Captación',
    concepto: 'Depósito seguro que permite administrar el dinero de forma práctica.',
    caracteristicas: [
      'Sin cuota de manejo',
      'Transferencias gratuitas entre cuentas del banco',
      'Tarjeta débito digital y física',
    ],
    beneficios: [
      'Operaciones desde cualquier lugar',
      'Mayor control del dinero mediante la App',
      'Seguridad con autenticación en dos pasos',
    ],
    requisitos: [
      'Ser mayor de 18 años (o menor con tutor legal)',
      'Documento de identidad vigente',
      'Registro en la App del banco',
    ],
  },
  'Cuenta Corriente': {
    tipo: 'Producto de Captación',
    concepto:
      'Producto de depósito a la vista que permite manejar cheques y realizar operaciones con mayor flexibilidad.',
    caracteristicas: [
      'Chequera asociada',
      'Posibilidad de sobregiro autorizado',
      'Sin monto mínimo de apertura',
      'Acceso a canales digitales y físicos',
    ],
    beneficios: [
      'Ideal para pagos y cobros empresariales',
      'Acceso rápido a fondos',
      'Control mediante extractos mensuales',
    ],
    requisitos: [
      'Ser mayor de edad',
      'Documento de identidad',
      'Soporte de ingresos o estados financieros',
      'Cumplir requisitos SARLAFT',
    ],
  },
  'CDT Digital': {
    tipo: 'Producto de Captación',
    concepto: 'Inversión a plazo fijo con rentabilidad asegurada.',
    caracteristicas: ['Plazos de 30 a 540 días', 'Tasa fija garantizada', 'Apertura 100% en línea'],
    beneficios: [
      'Inversión segura y protegida por Fogafín',
      'Sin cobros adicionales',
      'Intereses pagados según elección del cliente',
    ],
    requisitos: ['Mayor de edad', 'Cuenta en el banco', 'Monto mínimo $100.000'],
  },
  'Crédito de Libre Inversión': {
    tipo: 'Producto de Colocación',
    concepto: 'Préstamo sin destinación específica.',
    caracteristicas: ['Plazo hasta 60 meses', 'Desembolso en cuenta del banco', 'Tasa fija'],
    beneficios: [
      'Uso libre de los recursos',
      'Respuesta en 24 horas',
      'Sin codeudor en montos bajos',
    ],
    requisitos: ['Mayor de 21 años', 'Historial crediticio positivo', 'Soporte de ingresos'],
  },
  'Crédito Educativo EducaPlus': {
    tipo: 'Producto de Colocación',
    concepto: 'Financiación para estudios técnicos, tecnológicos, pregrado o posgrado.',
    caracteristicas: [
      'Plazo según el programa (6 a 36 meses)',
      'Desembolso directo a la institución educativa',
      'Tasa fija desde el inicio',
    ],
    beneficios: [
      'Facilita el acceso a educación superior',
      'Sin penalidad por abonos a capital',
      'Consulta y pago desde la App',
    ],
    requisitos: ['Documento de identidad', 'Soporte de matrícula', 'Ingresos demostrables'],
  },
  'Crédito Rotativo Empresarial': {
    tipo: 'Producto de Colocación',
    concepto:
      'Línea de crédito flexible para personas naturales con actividad empresarial o pymes.',
    caracteristicas: [
      'Cupo aprobado reutilizable',
      'Intereses solo sobre el monto usado',
      'Plazo indefinido sujeto a renovación anual',
      'Desembolsos a través de la cuenta del banco',
    ],
    beneficios: [
      'Liquidez inmediata',
      'Flexibilidad en pagos',
      'Facilita el flujo de caja de negocios',
    ],
    requisitos: [
      'Ser mayor de 21 años',
      'Demostrar ingresos comerciales o empresariales',
      'Historial crediticio positivo',
      'Documentación de la empresa o actividad independiente',
    ],
  },
};

module.exports = PRODUCTOS_FINANCIEROS;
