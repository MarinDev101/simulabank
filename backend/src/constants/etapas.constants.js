const ETAPAS_PRODUCTOS = {
  'Cuenta de Ahorros': [
    {
      id: 1,
      nombre: 'Saludo inicial',
      objetivo:
        'Dar la bienvenida y establecer una relación cordial con el cliente interesado en abrir una cuenta.',
      quien_inicia: 'asesor',
    },
    {
      id: 2,
      nombre: 'Detección de necesidades',
      objetivo:
        'Identificar los motivos del cliente para abrir una cuenta y sus hábitos financieros.',
      quien_inicia: 'asesor',
    },
    {
      id: 3,
      nombre: 'Presentación de producto',
      objetivo: 'Explicar beneficios, manejo y ventajas de la cuenta de ahorros.',
      quien_inicia: 'asesor',
    },
    {
      id: 4,
      nombre: 'Objeciones y dudas',
      objetivo: 'Resolver inquietudes sobre costos, seguridad o accesibilidad.',
      quien_inicia: 'cliente',
    },
    {
      id: 5,
      nombre: 'Cierre de interés',
      objetivo: 'Confirmar si el cliente desea continuar con la apertura.',
      quien_inicia: 'asesor',
    },
    {
      id: 6,
      nombre: 'Confirmación de datos',
      objetivo: 'Validar información básica del cliente para iniciar el proceso de apertura.',
      quien_inicia: 'asesor',
    },
    {
      id: 7,
      nombre: 'Despedida',
      objetivo: 'Cerrar la conversación de forma amable y profesional.',
      quien_inicia: 'cliente',
    },
  ],

  'Cuenta Corriente': [
    {
      id: 1,
      nombre: 'Saludo inicial',
      objetivo:
        'Dar la bienvenida e identificar el interés del cliente en productos transaccionales.',
      quien_inicia: 'asesor',
    },
    {
      id: 2,
      nombre: 'Detección de necesidades',
      objetivo:
        'Explorar si el cliente busca una cuenta para pagos frecuentes o gestión empresarial.',
      quien_inicia: 'asesor',
    },
    {
      id: 3,
      nombre: 'Presentación de producto',
      objetivo: 'Explicar las características de la cuenta corriente, chequera y sobregiros.',
      quien_inicia: 'asesor',
    },
    {
      id: 4,
      nombre: 'Objeciones y dudas',
      objetivo: 'Resolver preguntas sobre costos, cheques o control financiero.',
      quien_inicia: 'cliente',
    },
    {
      id: 5,
      nombre: 'Cierre de interés',
      objetivo: 'Verificar si el cliente desea continuar con la apertura.',
      quien_inicia: 'asesor',
    },
    {
      id: 6,
      nombre: 'Confirmación de datos',
      objetivo: 'Solicitar documentos e información básica para formalizar la solicitud.',
      quien_inicia: 'asesor',
    },
    {
      id: 7,
      nombre: 'Despedida',
      objetivo: 'Finalizar la conversación de forma profesional y cordial.',
      quien_inicia: 'cliente',
    },
  ],

  'CDT Digital': [
    {
      id: 1,
      nombre: 'Saludo inicial',
      objetivo: 'Dar la bienvenida e identificar el interés del cliente en inversiones seguras.',
      quien_inicia: 'asesor',
    },
    {
      id: 2,
      nombre: 'Detección de necesidades',
      objetivo: 'Comprender las metas de ahorro o inversión del cliente.',
      quien_inicia: 'asesor',
    },
    {
      id: 3,
      nombre: 'Presentación de producto',
      objetivo: 'Explicar la rentabilidad, plazos y beneficios del CDT digital.',
      quien_inicia: 'asesor',
    },
    {
      id: 4,
      nombre: 'Objeciones y dudas',
      objetivo: 'Aclarar inquietudes sobre tasas, plazos o seguridad del capital.',
      quien_inicia: 'cliente',
    },
    {
      id: 5,
      nombre: 'Cierre de interés',
      objetivo: 'Evaluar si el cliente está dispuesto a invertir y por cuánto tiempo.',
      quien_inicia: 'asesor',
    },
    {
      id: 6,
      nombre: 'Confirmación de datos',
      objetivo: 'Solicitar monto y plazo para simular o iniciar la inversión.',
      quien_inicia: 'asesor',
    },
    {
      id: 7,
      nombre: 'Despedida',
      objetivo: 'Finalizar la atención de forma amable.',
      quien_inicia: 'cliente',
    },
  ],

  'Crédito de Libre Inversión': [
    {
      id: 1,
      nombre: 'Saludo inicial',
      objetivo: 'Dar la bienvenida y conocer el interés del cliente en financiación personal.',
      quien_inicia: 'asesor',
    },
    {
      id: 2,
      nombre: 'Detección de necesidades',
      objetivo: 'Identificar el destino o motivo del préstamo.',
      quien_inicia: 'asesor',
    },
    {
      id: 3,
      nombre: 'Presentación de producto',
      objetivo: 'Explicar las condiciones, tasas y beneficios del crédito de libre inversión.',
      quien_inicia: 'asesor',
    },
    {
      id: 4,
      nombre: 'Objeciones y dudas',
      objetivo: 'Resolver inquietudes sobre plazos, intereses o requisitos.',
      quien_inicia: 'cliente',
    },
    {
      id: 5,
      nombre: 'Cierre de interés',
      objetivo: 'Confirmar si el cliente desea iniciar la solicitud del crédito.',
      quien_inicia: 'asesor',
    },
    {
      id: 6,
      nombre: 'Confirmación de datos',
      objetivo: 'Validar la información financiera necesaria para continuar el proceso.',
      quien_inicia: 'asesor',
    },
    {
      id: 7,
      nombre: 'Despedida',
      objetivo: 'Cerrar la conversación de forma cordial y profesional.',
      quien_inicia: 'cliente',
    },
  ],

  'Crédito Educativo EducaPlus': [
    {
      id: 1,
      nombre: 'Saludo inicial',
      objetivo: 'Dar la bienvenida e interesarse por los objetivos educativos del cliente.',
      quien_inicia: 'asesor',
    },
    {
      id: 2,
      nombre: 'Detección de necesidades',
      objetivo: 'Identificar el tipo de estudio y el monto requerido para financiarlo.',
      quien_inicia: 'asesor',
    },
    {
      id: 3,
      nombre: 'Presentación de producto',
      objetivo: 'Explicar condiciones, tasas y plazos del crédito educativo.',
      quien_inicia: 'asesor',
    },
    {
      id: 4,
      nombre: 'Objeciones y dudas',
      objetivo: 'Responder preguntas sobre desembolsos, instituciones o pagos.',
      quien_inicia: 'cliente',
    },
    {
      id: 5,
      nombre: 'Cierre de interés',
      objetivo: 'Confirmar si el cliente desea iniciar el proceso de financiación.',
      quien_inicia: 'asesor',
    },
    {
      id: 6,
      nombre: 'Confirmación de datos',
      objetivo: 'Solicitar documentos de matrícula y soporte de ingresos.',
      quien_inicia: 'asesor',
    },
    {
      id: 7,
      nombre: 'Despedida',
      objetivo: 'Finalizar la asesoría de forma cordial y profesional.',
      quien_inicia: 'cliente',
    },
  ],

  'Crédito Rotativo Empresarial': [
    {
      id: 1,
      nombre: 'Saludo inicial',
      objetivo:
        'Dar la bienvenida y mostrar disposición para apoyar el crecimiento del negocio del cliente.',
      quien_inicia: 'asesor',
    },
    {
      id: 2,
      nombre: 'Detección de necesidades',
      objetivo: 'Identificar las necesidades de liquidez o flujo de caja del cliente empresarial.',
      quien_inicia: 'asesor',
    },
    {
      id: 3,
      nombre: 'Presentación de producto',
      objetivo: 'Explicar las características del crédito rotativo, uso del cupo y ventajas.',
      quien_inicia: 'asesor',
    },
    {
      id: 4,
      nombre: 'Objeciones y dudas',
      objetivo: 'Aclarar inquietudes sobre tasas, renovación del cupo o documentación empresarial.',
      quien_inicia: 'cliente',
    },
    {
      id: 5,
      nombre: 'Cierre de interés',
      objetivo: 'Confirmar si el cliente desea continuar con la solicitud del cupo rotativo.',
      quien_inicia: 'asesor',
    },
    {
      id: 6,
      nombre: 'Confirmación de datos',
      objetivo: 'Verificar información del negocio y documentos requeridos.',
      quien_inicia: 'asesor',
    },
    {
      id: 7,
      nombre: 'Despedida',
      objetivo: 'Finalizar la conversación de manera amable y profesional.',
      quien_inicia: 'cliente',
    },
  ],
};

module.exports = ETAPAS_PRODUCTOS;
