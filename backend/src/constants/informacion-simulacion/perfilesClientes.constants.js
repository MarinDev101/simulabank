const PERFILES_CLIENTES = {
  'Privado / Private Banking': {
    'productos': ['CDT Digital', 'Cuenta Corriente'],
    'tipo_cliente': 'Personas con altos ingresos o patrimonio elevado',
    'rango_cop': 'Ingresos mayores o iguales a $25000000/mes o patrimonio mayor o igual a $1000000000',
    'enfoque_atencion': 'Atencion 100 por ciento personalizada, ejecutivo exclusivo'
  },
  'Persona natural (ingresos altos o medios-altos)': {
    'productos': ['Cuenta Corriente', 'CDT Digital', 'Credito de Libre Inversion'],
    'tipo_cliente': 'Personas naturales con ingresos altos o medios-altos',
    'rango_cop': 'Ingresos entre $6000000 y $25000000/mes',
    'enfoque_atencion': 'Atencion personalizada o mixta'
  },
  'Persona natural (ingresos modestos)': {
    'productos': ['Cuenta de Ahorros', 'Credito Educativo EducaPlus', 'Credito de Libre Inversion'],
    'tipo_cliente': 'Personas naturales con ingresos modestos',
    'rango_cop': 'Ingresos hasta $6000000/mes',
    'enfoque_atencion': 'Atencion personalizada o mixta'
  },
  'Basico / Salario minimo': {
    'productos': ['Cuenta de Ahorros', 'Credito Educativo EducaPlus'],
    'tipo_cliente': 'Personas naturales con ingresos cercanos al SMLV',
    'rango_cop': 'Ingresos desde $1300000/mes hasta $2600000/mes',
    'enfoque_atencion': 'Productos de bajo costo, cuentas de ahorro basicas, educacion financiera'
  },
  'PYME / MiPyme / Independiente': {
    'productos': ['Cuenta Corriente', 'Credito Rotativo Empresarial'],
    'tipo_cliente': 'Empresas pequenas y medianas (Microempresas o independientes)',
    'rango_cop': 'Ventas anuales entre $400000000 y $12000000000',
    'enfoque_atencion': 'Atencion gerenciada por asesor empresarial'
  },
  'Empresarial / Corporativo': {
    'productos': ['Cuenta Corriente', 'Credito Rotativo Empresarial', 'CDT Digital'],
    'tipo_cliente': 'Grandes empresas y corporaciones',
    'rango_cop': 'Ventas anuales mayores o iguales a $12000000000',
    'enfoque_atencion': 'Soluciones integrales personalizadas'
  }
};

module.exports = PERFILES_CLIENTES;
