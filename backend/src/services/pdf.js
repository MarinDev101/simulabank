const jsPdfConfig = require('../config/jspdf.config');

// Colores del tema
const COLORES = {
  primario: [41, 98, 255], // Azul principal
  secundario: [99, 102, 241], // Indigo
  exito: [34, 197, 94], // Verde
  advertencia: [251, 191, 36], // Amarillo
  texto: [31, 41, 55], // Gris oscuro
  textoClaro: [107, 114, 128], // Gris
  fondo: [249, 250, 251], // Gris muy claro
  fondoSeccion: [239, 246, 255], // Azul muy claro
  blanco: [255, 255, 255],
  linea: [229, 231, 235],
};

/**
 * Divide texto largo en líneas que caben en un ancho máximo
 */
function dividirTexto(doc, texto, maxWidth) {
  if (!texto) return [];
  return doc.splitTextToSize(String(texto), maxWidth);
}

/**
 * Formatea fecha a formato legible
 */
function formatearFecha(fecha) {
  if (!fecha) return 'N/A';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Dibuja encabezado de página
 */
function dibujarEncabezado(doc, datos, pageWidth) {
  // Fondo del encabezado
  doc.setFillColor(...COLORES.primario);
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Título principal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...COLORES.blanco);
  doc.text('SIMULABANK', 14, 15);

  // Subtítulo
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Evidencia de Simulación de Asesoría Bancaria', 14, 24);

  // Info derecha
  doc.setFontSize(9);
  doc.text(
    `Evidencia #${datos.evidencia.numeroEvidencia || datos.simulacion.id}`,
    pageWidth - 14,
    15,
    { align: 'right' }
  );
  doc.text(formatearFecha(datos.simulacion.fechaFinalizacion), pageWidth - 14, 22, {
    align: 'right',
  });

  return 45; // Y donde continuar
}

/**
 * Dibuja título de sección
 */
function dibujarTituloSeccion(doc, titulo, y, pageWidth) {
  doc.setFillColor(...COLORES.fondoSeccion);
  doc.roundedRect(14, y, pageWidth - 28, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORES.primario);
  doc.text(titulo, 18, y + 7);
  return y + 16;
}

/**
 * Dibuja campo clave-valor
 */
function dibujarCampo(doc, etiqueta, valor, x, y, maxWidth = 120) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORES.textoClaro);
  doc.text(etiqueta, x, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORES.texto);
  const lineas = dividirTexto(doc, valor || 'N/A', maxWidth);
  doc.text(lineas, x, y + 5);

  return y + 5 + lineas.length * 4;
}

/**
 * Verifica si necesita nueva página
 */
function verificarPagina(doc, y, alturaRequerida, pageHeight, pageWidth, datos) {
  if (y + alturaRequerida > pageHeight - 20) {
    doc.addPage();
    dibujarPiePagina(doc, pageWidth, pageHeight);
    return 20;
  }
  return y;
}

/**
 * Dibuja pie de página
 */
function dibujarPiePagina(doc, pageWidth, pageHeight) {
  const paginas = doc.internal.getNumberOfPages();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORES.textoClaro);
  doc.text(
    `Página ${paginas} | SimulaBank - Plataforma de Simulación Bancaria`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );
}

/**
 * Genera el PDF completo de evidencia
 */
async function generarPdfEvidencia(datos) {
  const doc = jsPdfConfig.createDocument({ orientation: 'portrait', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margen = 14;
  const anchoUtil = pageWidth - margen * 2;

  let y = dibujarEncabezado(doc, datos, pageWidth);

  // ═══════════════════════════════════════════════════════════
  // SECCIÓN 1: INFORMACIÓN GENERAL
  // ═══════════════════════════════════════════════════════════
  y = dibujarTituloSeccion(doc, '📋 INFORMACIÓN GENERAL', y, pageWidth);

  // Cuadro de resumen
  doc.setFillColor(...COLORES.fondo);
  doc.roundedRect(margen, y, anchoUtil, 35, 3, 3, 'F');

  const col1 = margen + 5;
  const col2 = pageWidth / 2 + 10;

  let yInfo = y + 8;
  dibujarCampo(doc, 'Aprendiz:', datos.aprendiz.nombreCompleto, col1, yInfo, 80);
  dibujarCampo(doc, 'Producto Bancario:', datos.producto.nombre, col2, yInfo, 80);

  yInfo += 15;
  dibujarCampo(doc, 'Modo de Simulación:', datos.simulacion.modo?.toUpperCase(), col1, yInfo, 80);
  dibujarCampo(doc, 'Duración Total:', datos.simulacion.duracionFormato, col2, yInfo, 80);

  y += 45;

  // Estadísticas rápidas
  const stats = [
    {
      label: 'Etapas',
      value: `${datos.simulacion.etapaActualIndex}/${datos.simulacion.totalEtapas}`,
    },
    { label: 'Mensajes', value: datos.conversacion.length },
    { label: 'Categoría', value: datos.producto.categoria },
    { label: 'Estado', value: datos.simulacion.estado?.toUpperCase() },
  ];

  const anchoStat = (anchoUtil - 15) / 4;
  stats.forEach((stat, i) => {
    const xStat = margen + i * (anchoStat + 5);
    doc.setFillColor(...(i % 2 === 0 ? COLORES.primario : COLORES.secundario));
    doc.roundedRect(xStat, y, anchoStat, 20, 2, 2, 'F');
    doc.setTextColor(...COLORES.blanco);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(String(stat.value), xStat + anchoStat / 2, y + 10, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(stat.label, xStat + anchoStat / 2, y + 16, { align: 'center' });
  });

  y += 30;

  // ═══════════════════════════════════════════════════════════
  // SECCIÓN 2: ESCENARIO DEL CLIENTE
  // ═══════════════════════════════════════════════════════════
  y = verificarPagina(doc, y, 80, pageHeight, pageWidth, datos);
  y = dibujarTituloSeccion(doc, '👤 ESCENARIO DEL CLIENTE SIMULADO', y, pageWidth);

  doc.setFillColor(...COLORES.fondo);
  doc.roundedRect(margen, y, anchoUtil, 65, 3, 3, 'F');

  let yCliente = y + 8;
  const cliente = datos.clienteSimulado;

  // Nombre destacado
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORES.primario);
  doc.text(`${cliente.nombre} (${cliente.edad})`, col1, yCliente);

  yCliente += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORES.texto);
  doc.text(`${cliente.profesion} | ${cliente.genero}`, col1, yCliente);

  yCliente += 10;
  yCliente = dibujarCampo(
    doc,
    'Situación Actual:',
    cliente.situacionActual,
    col1,
    yCliente,
    anchoUtil - 20
  );
  yCliente = dibujarCampo(
    doc,
    'Motivación:',
    cliente.motivacion,
    col1,
    yCliente + 3,
    anchoUtil - 20
  );

  // Info adicional en columnas
  yCliente += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...COLORES.textoClaro);
  doc.text(
    `Nivel de conocimiento: ${cliente.nivelConocimiento} | Perfil de riesgo: ${cliente.perfilRiesgo}`,
    col1,
    yCliente
  );

  y += 75;

  // Tipo y Perfil de cliente
  y = verificarPagina(doc, y, 30, pageHeight, pageWidth, datos);
  doc.setFillColor(255, 251, 235); // Amarillo muy claro
  doc.roundedRect(margen, y, anchoUtil / 2 - 5, 25, 2, 2, 'F');
  dibujarCampo(
    doc,
    'Tipo de Cliente:',
    datos.tipoCliente.tipo,
    margen + 5,
    y + 8,
    anchoUtil / 2 - 15
  );

  doc.setFillColor(236, 253, 245); // Verde muy claro
  doc.roundedRect(pageWidth / 2 + 2, y, anchoUtil / 2 - 5, 25, 2, 2, 'F');
  dibujarCampo(
    doc,
    'Perfil:',
    datos.perfilCliente.nombre,
    pageWidth / 2 + 7,
    y + 8,
    anchoUtil / 2 - 15
  );

  y += 35;

  // ═══════════════════════════════════════════════════════════
  // SECCIÓN 3: PRODUCTO BANCARIO
  // ═══════════════════════════════════════════════════════════
  y = verificarPagina(doc, y, 50, pageHeight, pageWidth, datos);
  y = dibujarTituloSeccion(doc, '🏦 PRODUCTO BANCARIO', y, pageWidth);

  doc.setFillColor(...COLORES.fondo);
  doc.roundedRect(margen, y, anchoUtil, 40, 3, 3, 'F');

  let yProd = y + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORES.primario);
  doc.text(`${datos.producto.nombre} (${datos.producto.categoria})`, col1, yProd);

  yProd += 8;
  const conceptoLineas = dividirTexto(doc, datos.producto.concepto, anchoUtil - 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORES.texto);
  doc.text(conceptoLineas.slice(0, 4), col1, yProd);

  y += 50;

  // ═══════════════════════════════════════════════════════════
  // SECCIÓN 4: CONVERSACIÓN
  // ═══════════════════════════════════════════════════════════
  doc.addPage();
  dibujarPiePagina(doc, pageWidth, pageHeight);
  y = 20;
  y = dibujarTituloSeccion(doc, '💬 HISTORIAL DE CONVERSACIÓN', y, pageWidth);

  for (const msg of datos.conversacion) {
    const esAsesor = msg.emisor === 'Asesor';
    const alturaEstimada = dividirTexto(doc, msg.mensaje, anchoUtil - 30).length * 4 + 20;

    y = verificarPagina(doc, y, alturaEstimada, pageHeight, pageWidth, datos);

    // Indicador de etapa si cambió
    if (
      msg.indiceEtapa &&
      (datos.conversacion.indexOf(msg) === 0 ||
        datos.conversacion[datos.conversacion.indexOf(msg) - 1]?.indiceEtapa !== msg.indiceEtapa)
    ) {
      doc.setFillColor(...COLORES.secundario);
      doc.roundedRect(margen, y, anchoUtil, 8, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...COLORES.blanco);
      doc.text(`ETAPA ${msg.indiceEtapa}: ${msg.nombreEtapa?.toUpperCase()}`, margen + 5, y + 5.5);
      y += 12;
    }

    // Burbuja de mensaje
    const xBurbuja = esAsesor ? margen + 20 : margen;
    const anchoBurbuja = anchoUtil - 25;
    const colorFondo = esAsesor ? [219, 234, 254] : [243, 244, 246];

    const lineasMsg = dividirTexto(doc, msg.mensaje, anchoBurbuja - 10);
    const alturaBurbuja = lineasMsg.length * 4 + 12;

    doc.setFillColor(...colorFondo);
    doc.roundedRect(xBurbuja, y, anchoBurbuja, alturaBurbuja, 3, 3, 'F');

    // Emisor
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...(esAsesor ? COLORES.primario : COLORES.textoClaro));
    doc.text(msg.emisor, xBurbuja + 5, y + 6);

    // Mensaje
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORES.texto);
    doc.text(lineasMsg, xBurbuja + 5, y + 12);

    y += alturaBurbuja + 5;
  }

  // ═══════════════════════════════════════════════════════════
  // SECCIÓN 5: ANÁLISIS DE DESEMPEÑO
  // ═══════════════════════════════════════════════════════════
  if (datos.analisisDesempeno && !datos.analisisDesempeno.error) {
    doc.addPage();
    dibujarPiePagina(doc, pageWidth, pageHeight);
    y = 20;
    y = dibujarTituloSeccion(doc, '📊 ANÁLISIS DE DESEMPEÑO', y, pageWidth);

    doc.setFillColor(...COLORES.fondo);
    doc.roundedRect(margen, y, anchoUtil, 60, 3, 3, 'F');

    let yAnalisis = y + 10;
    const analisis = datos.analisisDesempeno;

    if (typeof analisis === 'object') {
      for (const [clave, valor] of Object.entries(analisis)) {
        if (typeof valor === 'string' && valor.length > 0) {
          y = verificarPagina(doc, yAnalisis, 20, pageHeight, pageWidth, datos);
          yAnalisis = dibujarCampo(
            doc,
            clave.replace(/_/g, ' ').toUpperCase() + ':',
            valor,
            col1,
            yAnalisis,
            anchoUtil - 20
          );
          yAnalisis += 5;
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // SECCIÓN 6: RECOMENDACIONES DE APRENDIZAJE
  // ═══════════════════════════════════════════════════════════
  if (datos.recomendaciones?.length > 0) {
    y = verificarPagina(doc, y, 50, pageHeight, pageWidth, datos);
    y += 10;
    y = dibujarTituloSeccion(doc, '📚 RECOMENDACIONES DE APRENDIZAJE', y, pageWidth);

    for (const rec of datos.recomendaciones) {
      y = verificarPagina(doc, y, 30, pageHeight, pageWidth, datos);

      doc.setFillColor(254, 243, 199); // Amarillo claro
      doc.roundedRect(margen, y, anchoUtil, 8, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLORES.texto);
      doc.text(`Etapa ${rec.indiceEtapa}: ${rec.nombreEtapa}`, margen + 5, y + 5.5);
      y += 12;

      if (rec.recomendacionParaAsesor) {
        const recLineas = dividirTexto(doc, rec.recomendacionParaAsesor, anchoUtil - 10);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...COLORES.texto);
        doc.text(recLineas.slice(0, 6), margen + 5, y);
        y += recLineas.slice(0, 6).length * 4 + 8;
      }
    }
  }

  // Pie de página final
  dibujarPiePagina(doc, pageWidth, pageHeight);

  // Generar buffer
  const pdfBytes = doc.output('arraybuffer');

  return {
    buffer: Buffer.from(pdfBytes),
    peso: pdfBytes.byteLength,
  };
}

module.exports = { generarPdfEvidencia };
