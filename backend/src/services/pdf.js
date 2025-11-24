const jsPdfConfig = require('../config/jspdf.config');

// Colores del tema
const COLORES = {
  primario: [41, 98, 255],
  secundario: [99, 102, 241],
  exito: [34, 197, 94],
  advertencia: [251, 191, 36],
  texto: [31, 41, 55],
  textoClaro: [107, 114, 128],
  fondo: [249, 250, 251],
  fondoSeccion: [239, 246, 255],
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
 * Dibuja un ícono simple usando formas geométricas
 */
function dibujarIcono(doc, tipo, x, y, size = 4) {
  doc.setLineWidth(0.3);

  switch (tipo) {
    case 'info':
      doc.setDrawColor(...COLORES.primario);
      doc.setFillColor(...COLORES.primario);
      doc.circle(x, y, size, 'FD');
      doc.setTextColor(...COLORES.blanco);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('i', x, y + 1, { align: 'center' });
      break;
    case 'cliente':
      doc.setDrawColor(...COLORES.secundario);
      doc.setFillColor(...COLORES.secundario);
      doc.circle(x, y - 1, size / 2, 'FD');
      doc.roundedRect(x - size / 2, y + 0.5, size, size / 1.5, 1, 1, 'FD');
      break;
    case 'banco':
      doc.setDrawColor(...COLORES.primario);
      doc.setFillColor(...COLORES.primario);
      doc.rect(x - size / 2, y - size / 3, size, size, 'FD');
      doc.setFillColor(...COLORES.blanco);
      doc.rect(x - size / 4, y, size / 2, size / 2, 'F');
      break;
    case 'chat':
      doc.setDrawColor(...COLORES.exito);
      doc.setFillColor(...COLORES.exito);
      doc.roundedRect(x - size / 2, y - size / 2, size, size, 1, 1, 'FD');
      break;
    case 'estadisticas':
      doc.setDrawColor(...COLORES.advertencia);
      doc.setFillColor(...COLORES.advertencia);
      for (let i = 0; i < 3; i++) {
        const altura = (i + 1) * (size / 3);
        doc.rect(x - size / 2 + i * (size / 2.5), y + size / 2 - altura, size / 4, altura, 'FD');
      }
      break;
    case 'libro':
      doc.setDrawColor(...COLORES.secundario);
      doc.setFillColor(...COLORES.secundario);
      doc.rect(x - size / 2, y - size / 2, size, size * 0.8, 'FD');
      doc.setFillColor(...COLORES.blanco);
      doc.rect(x - size / 4, y - size / 4, size / 2, 0.5, 'F');
      doc.rect(x - size / 4, y, size / 2, 0.5, 'F');
      break;
  }
}

/**
 * Dibuja encabezado de página
 */
function dibujarEncabezado(doc, datos, pageWidth) {
  // Fondo del encabezado con degradado simulado
  doc.setFillColor(...COLORES.primario);
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Línea decorativa superior
  doc.setFillColor(...COLORES.secundario);
  doc.rect(0, 0, pageWidth, 2, 'F');

  // Título principal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...COLORES.blanco);
  doc.text('SIMULABANK', 14, 15);

  // Subtítulo
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Evidencia de Simulación de Asesoría Bancaria', 14, 24);

  // Info derecha con diseño mejorado
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Evidencia #${datos.evidencia.numeroEvidencia || datos.simulacion.id}`,
    pageWidth - 14,
    15,
    { align: 'right' }
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(formatearFecha(datos.simulacion.fechaFinalizacion), pageWidth - 14, 22, {
    align: 'right',
  });

  // Línea decorativa inferior
  doc.setFillColor(...COLORES.advertencia);
  doc.rect(0, 33, pageWidth, 2, 'F');

  return 45;
}

/**
 * Dibuja título de sección con icono
 */
function dibujarTituloSeccion(doc, titulo, y, pageWidth, icono = null) {
  // Fondo con sombra simulada
  doc.setFillColor(220, 220, 220);
  doc.roundedRect(14.5, y + 0.5, pageWidth - 28, 10, 2, 2, 'F');

  doc.setFillColor(...COLORES.fondoSeccion);
  doc.roundedRect(14, y, pageWidth - 28, 10, 2, 2, 'F');

  // Barra lateral de color
  doc.setFillColor(...COLORES.primario);
  doc.roundedRect(14, y, 3, 10, 1, 1, 'F');

  // Icono si se especifica
  if (icono) {
    dibujarIcono(doc, icono, 22, y + 5);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORES.primario);
  doc.text(titulo, icono ? 28 : 22, y + 7);

  return y + 16;
}

/**
 * Dibuja campo clave-valor con mejor diseño
 */
function dibujarCampo(doc, etiqueta, valor, x, y, maxWidth = 120) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORES.textoClaro);
  doc.text(etiqueta, x, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
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
 * Dibuja pie de página mejorado
 */
function dibujarPiePagina(doc, pageWidth, pageHeight) {
  const paginas = doc.internal.getNumberOfPages();

  // Línea decorativa
  doc.setDrawColor(...COLORES.linea);
  doc.setLineWidth(0.5);
  doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORES.textoClaro);
  doc.text(`Página ${paginas}`, 14, pageHeight - 10);
  doc.text('SimulaBank - Plataforma de Simulación Bancaria', pageWidth / 2, pageHeight - 10, {
    align: 'center',
  });
  doc.text(new Date().toLocaleDateString('es-CO'), pageWidth - 14, pageHeight - 10, {
    align: 'right',
  });
}

/**
 * Dibuja tarjeta de estadística
 */
function dibujarTarjetaEstadistica(doc, label, value, x, y, ancho, color) {
  // Sombra
  doc.setFillColor(220, 220, 220);
  doc.roundedRect(x + 0.5, y + 0.5, ancho, 20, 2, 2, 'F');

  // Tarjeta
  doc.setFillColor(...color);
  doc.roundedRect(x, y, ancho, 20, 2, 2, 'F');

  // Valor
  doc.setTextColor(...COLORES.blanco);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(String(value), x + ancho / 2, y + 10, { align: 'center' });

  // Etiqueta
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(label, x + ancho / 2, y + 16, { align: 'center' });
}

/**
 * Genera el PDF completo de evidencia
 */
async function generarPdfEvidencia(datos, obtenerPeso = false) {
  const doc = jsPdfConfig.createDocument({ orientation: 'portrait', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margen = 14;
  const anchoUtil = pageWidth - margen * 2;

  let y = dibujarEncabezado(doc, datos, pageWidth);

  // SECCIÓN 1: INFORMACIÓN GENERAL
  y = dibujarTituloSeccion(doc, 'INFORMACIÓN GENERAL', y, pageWidth, 'info');

  // Cuadro de resumen con sombra
  doc.setFillColor(220, 220, 220);
  doc.roundedRect(margen + 0.5, y + 0.5, anchoUtil, 35, 3, 3, 'F');
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

  // Estadísticas con diseño mejorado
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
    const color = i % 2 === 0 ? COLORES.primario : COLORES.secundario;
    dibujarTarjetaEstadistica(doc, stat.label, stat.value, xStat, y, anchoStat, color);
  });

  y += 30;

  // SECCIÓN 2: ESCENARIO DEL CLIENTE
  y = verificarPagina(doc, y, 80, pageHeight, pageWidth, datos);
  y = dibujarTituloSeccion(doc, 'ESCENARIO DEL CLIENTE SIMULADO', y, pageWidth, 'cliente');

  doc.setFillColor(220, 220, 220);
  doc.roundedRect(margen + 0.5, y + 0.5, anchoUtil, 70, 3, 3, 'F');
  doc.setFillColor(...COLORES.fondo);
  doc.roundedRect(margen, y, anchoUtil, 70, 3, 3, 'F');

  let yCliente = y + 8;
  const cliente = datos.clienteSimulado;

  // Nombre destacado
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLORES.primario);
  doc.text(`${cliente.nombre} (${cliente.edad} años)`, col1, yCliente);

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

  yCliente += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...COLORES.textoClaro);
  doc.text(
    `Nivel: ${cliente.nivelConocimiento} | Perfil de riesgo: ${cliente.perfilRiesgo}`,
    col1,
    yCliente
  );

  y += 80;

  // Tipo y Perfil
  y = verificarPagina(doc, y, 30, pageHeight, pageWidth, datos);

  // Tarjeta Tipo de Cliente
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(margen, y, anchoUtil / 2 - 5, 25, 2, 2, 'F');
  doc.setDrawColor(251, 191, 36);
  doc.setLineWidth(0.5);
  doc.roundedRect(margen, y, anchoUtil / 2 - 5, 25, 2, 2, 'S');
  dibujarCampo(
    doc,
    'Tipo de Cliente:',
    datos.tipoCliente.tipo,
    margen + 5,
    y + 8,
    anchoUtil / 2 - 15
  );

  // Tarjeta Perfil
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(pageWidth / 2 + 2, y, anchoUtil / 2 - 5, 25, 2, 2, 'F');
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.5);
  doc.roundedRect(pageWidth / 2 + 2, y, anchoUtil / 2 - 5, 25, 2, 2, 'S');
  dibujarCampo(
    doc,
    'Perfil:',
    datos.perfilCliente.nombre,
    pageWidth / 2 + 7,
    y + 8,
    anchoUtil / 2 - 15
  );

  y += 35;

  // SECCIÓN 3: PRODUCTO BANCARIO
  y = verificarPagina(doc, y, 50, pageHeight, pageWidth, datos);
  y = dibujarTituloSeccion(doc, 'PRODUCTO BANCARIO', y, pageWidth, 'banco');

  doc.setFillColor(220, 220, 220);
  doc.roundedRect(margen + 0.5, y + 0.5, anchoUtil, 45, 3, 3, 'F');
  doc.setFillColor(...COLORES.fondo);
  doc.roundedRect(margen, y, anchoUtil, 45, 3, 3, 'F');

  let yProd = y + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORES.primario);
  doc.text(`${datos.producto.nombre}`, col1, yProd);

  doc.setFontSize(9);
  doc.setTextColor(...COLORES.secundario);
  doc.text(`Categoría: ${datos.producto.categoria}`, col1, yProd + 5);

  yProd += 12;
  const conceptoLineas = dividirTexto(doc, datos.producto.concepto, anchoUtil - 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORES.texto);
  doc.text(conceptoLineas.slice(0, 4), col1, yProd);

  y += 55;

  // SECCIÓN 4: CONVERSACIÓN
  doc.addPage();
  dibujarPiePagina(doc, pageWidth, pageHeight);
  y = 20;
  y = dibujarTituloSeccion(doc, 'HISTORIAL DE CONVERSACIÓN', y, pageWidth, 'chat');

  let etapaAnterior = null;

  for (const msg of datos.conversacion) {
    const esAsesor = msg.emisor === 'Asesor';
    const alturaEstimada = dividirTexto(doc, msg.mensaje, anchoUtil - 30).length * 4 + 20;

    y = verificarPagina(doc, y, alturaEstimada, pageHeight, pageWidth, datos);

    // Indicador de etapa
    if (msg.indiceEtapa && msg.indiceEtapa !== etapaAnterior) {
      doc.setFillColor(...COLORES.secundario);
      doc.roundedRect(margen, y, anchoUtil, 8, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...COLORES.blanco);
      doc.text(`ETAPA ${msg.indiceEtapa}: ${msg.nombreEtapa?.toUpperCase()}`, margen + 5, y + 5.5);
      y += 12;
      etapaAnterior = msg.indiceEtapa;
    }

    // Burbuja de mensaje
    const xBurbuja = esAsesor ? margen + 20 : margen;
    const anchoBurbuja = anchoUtil - 25;
    const colorFondo = esAsesor ? [219, 234, 254] : [243, 244, 246];
    const colorBorde = esAsesor ? COLORES.primario : COLORES.linea;

    const lineasMsg = dividirTexto(doc, msg.mensaje, anchoBurbuja - 10);
    const alturaBurbuja = lineasMsg.length * 4 + 12;

    // Sombra
    doc.setFillColor(220, 220, 220);
    doc.roundedRect(xBurbuja + 0.5, y + 0.5, anchoBurbuja, alturaBurbuja, 3, 3, 'F');

    // Burbuja
    doc.setFillColor(...colorFondo);
    doc.roundedRect(xBurbuja, y, anchoBurbuja, alturaBurbuja, 3, 3, 'F');

    // Borde
    doc.setDrawColor(...colorBorde);
    doc.setLineWidth(0.3);
    doc.roundedRect(xBurbuja, y, anchoBurbuja, alturaBurbuja, 3, 3, 'S');

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

  // SECCIÓN 5: ANÁLISIS DE DESEMPEÑO
  if (datos.analisisDesempeno && !datos.analisisDesempeno.error) {
    doc.addPage();
    dibujarPiePagina(doc, pageWidth, pageHeight);
    y = 20;
    y = dibujarTituloSeccion(doc, 'ANÁLISIS DE DESEMPEÑO', y, pageWidth, 'estadisticas');

    const analisis = datos.analisisDesempeno;

    // Puntuación destacada
    if (analisis.puntuacion_cualitativa) {
      doc.setFillColor(...COLORES.exito);
      doc.roundedRect(margen, y, anchoUtil, 15, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...COLORES.blanco);
      doc.text('CALIFICACIÓN:', margen + 5, y + 7);
      doc.setFontSize(12);
      doc.text(analisis.puntuacion_cualitativa.toUpperCase(), margen + 5, y + 12);
      y += 20;
    }

    // Resumen
    if (analisis.resumen_general) {
      doc.setFillColor(220, 220, 220);
      doc.roundedRect(margen + 0.5, y + 0.5, anchoUtil, 50, 3, 3, 'F');
      doc.setFillColor(...COLORES.fondo);
      doc.roundedRect(margen, y, anchoUtil, 50, 3, 3, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...COLORES.primario);
      doc.text('RESUMEN GENERAL:', margen + 5, y + 7);

      const resumenLineas = dividirTexto(doc, analisis.resumen_general, anchoUtil - 15);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...COLORES.texto);
      doc.text(resumenLineas.slice(0, 8), margen + 5, y + 13);
    }
  }

  // SECCIÓN 6: RECOMENDACIONES
  if (datos.recomendaciones?.length > 0) {
    y = verificarPagina(doc, y + 60, 50, pageHeight, pageWidth, datos);
    y = dibujarTituloSeccion(doc, 'RECOMENDACIONES DE APRENDIZAJE', y + 60, pageWidth, 'libro');

    for (const rec of datos.recomendaciones) {
      y = verificarPagina(doc, y, 35, pageHeight, pageWidth, datos);

      // Encabezado de etapa
      doc.setFillColor(254, 243, 199);
      doc.roundedRect(margen, y, anchoUtil, 8, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLORES.texto);
      doc.text(`Etapa ${rec.indiceEtapa}: ${rec.nombreEtapa}`, margen + 5, y + 5.5);
      y += 12;

      // Recomendación
      if (rec.recomendacionParaAsesor) {
        doc.setFillColor(255, 255, 255);
        const recLineas = dividirTexto(doc, rec.recomendacionParaAsesor, anchoUtil - 15);
        const alturaRec = recLineas.slice(0, 5).length * 4 + 8;

        doc.roundedRect(margen, y, anchoUtil, alturaRec, 2, 2, 'F');
        doc.setDrawColor(...COLORES.linea);
        doc.setLineWidth(0.3);
        doc.roundedRect(margen, y, anchoUtil, alturaRec, 2, 2, 'S');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...COLORES.texto);
        doc.text(recLineas.slice(0, 5), margen + 5, y + 5);
        y += alturaRec + 5;
      }
    }
  }

  // Pie de página final
  dibujarPiePagina(doc, pageWidth, pageHeight);

  // Generar buffer
  const pdfBytes = doc.output('arraybuffer');
  const peso = pdfBytes.byteLength;

  if (obtenerPeso) {
    return { peso, pesoKb: Math.round(peso / 1024) };
  }

  return {
    buffer: Buffer.from(pdfBytes),
    peso,
    pesoKb: Math.round(peso / 1024),
  };
}

module.exports = { generarPdfEvidencia };
