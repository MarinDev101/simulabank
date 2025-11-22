const jsPDFConfig = {
  // Opciones principales para la instancia de jsPDF
  defaultOptions: {
    orientation: 'landscape',
    unit: 'mm',
    format: 'letter',
    putOnlyUsedFonts: true,
    compress: true,
    floatPrecision: 'smart',
    hotfixes: ['px_scaling'],
  },

  // Otras configuraciones útiles en tu módulo
  // Puedes tener funciones para crear instancias con estas opciones
  createDocument(options = {}) {
    const { jsPDF } = require('jspdf');
    // Mezclar las opciones por defecto con las que te pasen
    const opts = { ...this.defaultOptions, ...options };
    return new jsPDF(opts);
  },
};

module.exports = jsPDFConfig;
