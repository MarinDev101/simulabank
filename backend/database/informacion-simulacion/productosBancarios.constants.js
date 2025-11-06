const PRODUCTOS_BANCARIOS = {
  'Cuenta de Ahorros': {
    'categoria': 'Captacion',
    'concepto': 'Deposito seguro que permite administrar el dinero de forma practica.',
    'caracteristicas': [
      'Sin cuota de manejo',
      'Transferencias gratuitas entre cuentas del banco',
      'Tarjeta debito digital y fisica'
    ],
    'beneficios': [
      'Operaciones desde cualquier lugar',
      'Mayor control del dinero mediante la App',
      'Seguridad con autenticacion en dos pasos'
    ],
    'requisitos': [
      'Ser mayor de 18 anos (o menor con tutor legal)',
      'Documento de identidad vigente',
      'Registro en la App del banco'
    ]
  },
  'Cuenta Corriente': {
    'categoria': 'Captacion',
    'concepto': 'Producto de deposito a la vista que permite manejar cheques y realizar operaciones con mayor flexibilidad.',
    'caracteristicas': [
      'Chequera asociada',
      'Posibilidad de sobregiro autorizado',
      'Sin monto minimo de apertura',
      'Acceso a canales digitales y fisicos'
    ],
    'beneficios': [
      'Ideal para pagos y cobros empresariales',
      'Acceso rapido a fondos',
      'Control mediante extractos mensuales'
    ],
    'requisitos': [
      'Ser mayor de edad',
      'Documento de identidad',
      'Soporte de ingresos o estados financieros',
      'Cumplir requisitos SARLAFT'
    ]
  },
  'CDT Digital': {
    'categoria': 'Captacion',
    'concepto': 'Inversion a plazo fijo con rentabilidad asegurada.',
    'caracteristicas': [
      'Plazos de 30 a 540 dias',
      'Tasa fija garantizada',
      'Apertura 100% en linea'
    ],
    'beneficios': [
      'Inversion segura y protegida por Fogafin',
      'Sin cobros adicionales',
      'Intereses pagados segun eleccion del cliente'
    ],
    'requisitos': [
      'Mayor de edad',
      'Cuenta en el banco',
      'Monto minimo 100000'
    ]
  },
  'Credito de Libre Inversion': {
    'categoria': 'Colocacion',
    'concepto': 'Prestamo sin destinacion especifica.',
    'caracteristicas': [
      'Plazo hasta 60 meses',
      'Desembolso en cuenta del banco',
      'Tasa fija'
    ],
    'beneficios': [
      'Uso libre de los recursos',
      'Respuesta en 24 horas',
      'Sin codeudor en montos bajos'
    ],
    'requisitos': [
      'Mayor de 21 anos',
      'Historial crediticio positivo',
      'Soporte de ingresos'
    ]
  },
  'Credito Educativo EducaPlus': {
    'categoria': 'Colocacion',
    'concepto': 'Financiacion para estudios tecnicos, tecnologicos, pregrado o posgrado.',
    'caracteristicas': [
      'Plazo segun el programa (6 a 36 meses)',
      'Desembolso directo a la institucion educativa',
      'Tasa fija desde el inicio'
    ],
    'beneficios': [
      'Facilita el acceso a educacion superior',
      'Sin penalidad por abonos a capital',
      'Consulta y pago desde la App'
    ],
    'requisitos': [
      'Documento de identidad',
      'Soporte de matricula',
      'Ingresos demostrables'
    ]
  },
  'Credito Rotativo Empresarial': {
    'categoria': 'Colocacion',
    'concepto': 'Linea de credito flexible para personas naturales con actividad empresarial o pymes.',
    'caracteristicas': [
      'Cupo aprobado reutilizable',
      'Intereses solo sobre el monto usado',
      'Plazo indefinido sujeto a renovacion anual',
      'Desembolsos a traves de la cuenta del banco'
    ],
    'beneficios': [
      'Liquidez inmediata',
      'Flexibilidad en pagos',
      'Facilita el flujo de caja de negocios'
    ],
    'requisitos': [
      'Ser mayor de 21 anos',
      'Demostrar ingresos comerciales o empresariales',
      'Historial crediticio positivo',
      'Documentacion de la empresa o actividad independiente'
    ]
  }
};

module.exports = PRODUCTOS_BANCARIOS;
