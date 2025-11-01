const PERFILES_CLIENTES = {
  'Privado / Private Banking': {
    productos: ['CDT Digital', 'Cuenta Corriente (premium)'],
    tipoCliente: 'Personas con altos ingresos o patrimonio elevado',
    rangoCOP: 'Ingresos ≥ $25.000.000/mes o patrimonio ≥ $1.000.000.000',
    enfoqueAtencion: 'Atención 100% personalizada, ejecutivo exclusivo',
  },
  'Persona natural (ingresos altos o medios-altos)': {
    productos: ['Cuenta Corriente', 'CDT Digital', 'Crédito de Libre Inversión'],
    tipoCliente: 'Personas naturales con ingresos altos o medios-altos',
    rangoCOP: 'Ingresos entre $6.000.000 y $25.000.000/mes',
    enfoqueAtencion: 'Atención personalizada o mixta',
  },
  'Persona natural (ingresos modestos)': {
    productos: ['Cuenta de Ahorros', 'Crédito Educativo', 'Crédito de Libre Inversión'],
    tipoCliente: 'Personas naturales con ingresos modestos',
    rangoCOP: 'Ingresos hasta $6.000.000/mes',
    enfoqueAtencion: 'Atención personalizada o mixta',
  },
  'Básico / Salario mínimo': {
    productos: ['Cuenta de Ahorros', 'Crédito Educativo'],
    tipoCliente: 'Personas naturales con ingresos cercanos al SMLV',
    rangoCOP: 'Ingresos desde $1.300.000/mes hasta $2.600.000/mes',
    enfoqueAtencion: 'Productos de bajo costo, cuentas de ahorro básicas, educación financiera',
  },
  'PYME / MiPyme / Independiente': {
    productos: ['Cuenta Corriente', 'Crédito Rotativo Empresarial'],
    tipoCliente: 'Empresas pequeñas y medianas (Microempresas o independientes)',
    rangoCOP: 'Ventas anuales entre $400.000.000 y $12.000.000.000',
    enfoqueAtencion: 'Atención gerenciada por asesor empresarial',
  },
  'Empresarial / Corporativo': {
    productos: ['Cuenta Corriente', 'Crédito Rotativo Empresarial', 'CDT Digital institucional'],
    tipoCliente: 'Grandes empresas y corporaciones',
    rangoCOP: 'Ventas anuales ≥ $12.000.000.000',
    enfoqueAtencion: 'Soluciones integrales personalizadas',
  },
};

module.exports = PERFILES_CLIENTES;
