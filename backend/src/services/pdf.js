const jsPdfConfig = require('../config/jspdf.config');
const fs = require('fs');
const path = require('path');

// Paleta de colores profesional mejorada
const COLORES = {
  primario: [41, 98, 255],
  primarioOscuro: [30, 70, 200],
  primarioClaro: [219, 234, 254],
  texto: [31, 41, 55],
  textoSecundario: [75, 85, 99],
  textoClaro: [107, 114, 128],
  fondoGris: [249, 250, 251],
  fondoGrisOscuro: [243, 244, 246],
  blanco: [255, 255, 255],
  linea: [229, 231, 235],
  lineaOscura: [156, 163, 175],
  azulClaro: [239, 246, 255],
  verdeClaro: [240, 253, 244],
  verde: [34, 197, 94],
  naranja: [251, 146, 60],
};

/**
 * Divide texto largo en líneas que caben en un ancho máximo
 */
function dividirTexto(doc, texto, maxWidth) {
  if (!texto) return [];
  const textoLimpio = String(texto).replace(/\s+/g, ' ').trim();
  return doc.splitTextToSize(textoLimpio, maxWidth);
}

/**
 * Mide la altura real que ocupará un texto
 */
function medirAlturaTexto(doc, texto, maxWidth, fontSize = 9, lineHeightFactor = 1.3) {
  const prevSize = doc.internal.getFontSize();
  doc.setFontSize(fontSize);
  const lineas = dividirTexto(doc, texto, maxWidth);
  const alturaPorLinea = fontSize * 0.352778 * lineHeightFactor;
  const alturaTotal = lineas.length * alturaPorLinea + 1;
  doc.setFontSize(prevSize);
  return { lineas, altura: alturaTotal, numLineas: lineas.length };
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
 * Dibuja encabezado de página mejorado
 */
function dibujarEncabezado(doc, datos, pageWidth) {
  // Fondo del encabezado
  doc.setFillColor(...COLORES.primario);
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Logo a la izquierda - más grande y centrado verticalmente
  try {
    const logoPath = path.resolve(__dirname, '../constants/imgs/imagotipo_simulabank.png');
    if (fs.existsSync(logoPath)) {
      const imgData = fs.readFileSync(logoPath).toString('base64');
      const logoWidth = 58;
      const logoHeight = logoWidth / 7.95;
      const logoY = (32 - logoHeight) / 2; // Centrado vertical
      doc.addImage('data:image/png;base64,' + imgData, 'PNG', 14, logoY, logoWidth, logoHeight);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(...COLORES.blanco);
      doc.text('SimulaBank', 14, 18);
    }
  } catch {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...COLORES.blanco);
    doc.text('SimulaBank', 14, 18);
  }

  // Información a la derecha
  const margenDerecho = pageWidth - 14;

  // Número de evidencia
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORES.blanco);
  const numeroEvidencia =
    'Evidencia #' + String(datos.evidencia.numeroEvidencia || datos.simulacion.id);
  doc.text(numeroEvidencia, margenDerecho, 11, { align: 'right' });

  // Subtítulo
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORES.blanco);
  doc.text('Evidencia de Simulación de Asesoría Bancaria', margenDerecho, 18, { align: 'right' });

  // Fecha
  doc.setFontSize(7.5);
  const fechaTexto = formatearFecha(datos.simulacion.fechaFinalizacion);
  doc.text(fechaTexto, margenDerecho, 24, { align: 'right' });

  return 38;
}

/**
 * Dibuja título de sección con estilo moderno
 */
function dibujarTituloSeccion(doc, titulo, y, pageWidth, compacto = false) {
  const margen = 14;
  const anchoUtil = pageWidth - margen * 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(compacto ? 11 : 12);
  doc.setTextColor(...COLORES.primario);
  const lineasTitulo = dividirTexto(doc, titulo, anchoUtil);
  doc.text(lineasTitulo, margen, y);

  const alturaUsada = lineasTitulo.length * (compacto ? 3.8 : 4.2);

  // Línea decorativa
  doc.setDrawColor(...COLORES.primario);
  doc.setLineWidth(1.5);
  doc.line(margen, y + alturaUsada, margen + 40, y + alturaUsada);

  return y + alturaUsada + (compacto ? 6 : 10);
}

/**
 * Dibuja una tarjeta de información moderna
 */
function dibujarTarjeta(doc, x, y, ancho, alto, colorFondo = COLORES.fondoGris) {
  // Tarjeta principal con bordes redondeados simulados
  doc.setFillColor(...colorFondo);
  doc.rect(x, y, ancho, alto, 'F');

  // Borde sutil
  doc.setDrawColor(...COLORES.linea);
  doc.setLineWidth(0.3);
  doc.rect(x, y, ancho, alto, 'S');
}

/**
 * Dibuja estadística destacada con altura dinámica y versión compacta
 */
function dibujarEstadistica(doc, x, y, ancho, label, valor, compacto = false) {
  const padding = compacto ? 3 : 4;
  const anchoTexto = ancho - padding * 2;

  // Medir altura necesaria para el valor
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(compacto ? 9 : 10);
  const medidaValor = medirAlturaTexto(doc, String(valor), anchoTexto, compacto ? 9 : 10, 1.1);

  // Medir altura necesaria para el label
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  const medidaLabel = medirAlturaTexto(doc, label.toUpperCase(), anchoTexto, 6.5, 1.1);

  const alto = medidaValor.altura + medidaLabel.altura + padding * 2;

  // Fondo de la tarjeta
  dibujarTarjeta(doc, x, y, ancho, alto, COLORES.blanco);

  // Valor principal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(compacto ? 9 : 10);
  doc.setTextColor(...COLORES.texto);
  doc.text(medidaValor.lineas, x + padding, y + padding + 2.5);

  // Label
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORES.textoClaro);
  doc.text(medidaLabel.lineas, x + padding, y + padding + medidaValor.altura + 1);

  return y + alto;
}

/**
 * Dibuja sección de información con etiquetas - versión una columna
 */
function dibujarSeccionInfo(doc, x, y, ancho, items) {
  let yActual = y;

  items.forEach((item, index) => {
    if (index > 0) yActual += 3;

    // Label en color secundario
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...COLORES.textoClaro);
    const lineasLabel = dividirTexto(doc, item.label.toUpperCase(), ancho);
    doc.text(lineasLabel, x, yActual);
    yActual += lineasLabel.length * 2.4 + 1.5;

    // Valor principal
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORES.texto);
    const lineasValor = dividirTexto(doc, item.value || 'N/A', ancho);
    doc.text(lineasValor, x, yActual);
    yActual += lineasValor.length * 3.2 + 1.5;
  });

  return yActual;
}

/**
 * Verifica si necesita nueva página y dibuja pie de página si es necesario
 */
function verificarYAgregarPagina(doc, y, alturaRequerida, pageHeight, pageWidth, numeroPagina) {
  if (y + alturaRequerida > pageHeight - 30) {
    dibujarPiePagina(doc, pageWidth, pageHeight, numeroPagina);
    doc.addPage();
    return { y: 20, numeroPagina: numeroPagina + 1 };
  }
  return { y, numeroPagina };
}

/**
 * Dibuja pie de página
 */
function dibujarPiePagina(doc, pageWidth, pageHeight, numeroPagina) {
  doc.setDrawColor(...COLORES.linea);
  doc.setLineWidth(0.3);
  doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORES.textoClaro);
  doc.text('Página ' + String(numeroPagina), 14, pageHeight - 10);
  doc.text('SimulaBank - Plataforma de Simulación Bancaria', pageWidth / 2, pageHeight - 10, {
    align: 'center',
  });
  doc.text(new Date().toLocaleDateString('es-CO'), pageWidth - 14, pageHeight - 10, {
    align: 'right',
  });
}

/**
 * Dibuja un mensaje del chat con mejor claridad visual
 */
function dibujarMensajeChat(doc, msg, y, pageWidth, margen, esAsesor) {
  const anchoMax = pageWidth - margen * 2;
  const anchoMensaje = anchoMax * 0.72;
  const padding = 5;

  // Medir altura del mensaje
  const medida = medirAlturaTexto(doc, msg.mensaje, anchoMensaje - padding * 2, 9, 1.3);
  const alturaMensaje = medida.altura + padding * 2 + 5;

  // Posiciones según emisor
  let xInicio, xTexto, alignEmisor;
  if (esAsesor) {
    xInicio = pageWidth - margen - anchoMensaje;
    xTexto = xInicio + padding;
    alignEmisor = 'right';
  } else {
    xInicio = margen;
    xTexto = xInicio + padding;
    alignEmisor = 'left';
  }

  // Fondo del mensaje
  const colorFondo = esAsesor ? COLORES.azulClaro : COLORES.fondoGris;
  doc.setFillColor(...colorFondo);
  doc.rect(xInicio, y, anchoMensaje, alturaMensaje, 'F');

  // Borde del mensaje
  const colorBorde = esAsesor ? COLORES.primario : COLORES.linea;
  doc.setDrawColor(...colorBorde);
  doc.setLineWidth(0.5);
  doc.rect(xInicio, y, anchoMensaje, alturaMensaje, 'S');

  // Etiqueta del emisor
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...(esAsesor ? COLORES.primario : COLORES.textoSecundario));
  const xEmisor = esAsesor ? xInicio + anchoMensaje - padding : xTexto;
  const emisorTexto = String(msg.emisor || '').toUpperCase();
  doc.text(emisorTexto, xEmisor, y + 4.5, { align: alignEmisor });

  // Contenido del mensaje
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORES.texto);
  doc.text(medida.lineas, xTexto, y + 10);

  return alturaMensaje + 4;
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
  let numeroPagina = 1;

  // ==================== PÁGINA 1: RESUMEN EJECUTIVO Y PERFIL DEL CLIENTE ====================
  let y = dibujarEncabezado(doc, datos, pageWidth);

  // Título principal
  y = dibujarTituloSeccion(doc, 'Resumen de Simulación', y, pageWidth, true);

  // Tarjeta principal con información del aprendiz (más compacta)
  const paddingTarjeta = 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const medidaNombreAprendiz = medirAlturaTexto(
    doc,
    datos.aprendiz.nombreCompleto,
    anchoUtil - paddingTarjeta * 2,
    10,
    1.1
  );

  const altoTarjetaPrincipal = 8 + medidaNombreAprendiz.altura + paddingTarjeta * 2;

  dibujarTarjeta(doc, margen, y, anchoUtil, altoTarjetaPrincipal, COLORES.primarioClaro);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORES.primario);
  doc.text('APRENDIZ', margen + paddingTarjeta, y + paddingTarjeta + 2.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORES.texto);
  doc.text(medidaNombreAprendiz.lineas, margen + paddingTarjeta, y + paddingTarjeta + 7);

  y += altoTarjetaPrincipal + 6;

  // Estadísticas en dos filas (más compactas)
  const espacioEntreStats = 3;
  const anchoStat = (anchoUtil - espacioEntreStats * 2) / 3;

  // Primera fila de estadísticas
  let yStats = y;
  const altoStat1 =
    dibujarEstadistica(
      doc,
      margen,
      yStats,
      anchoStat,
      'Modo',
      datos.simulacion.modo || 'N/A',
      true
    ) - yStats;
  const etapasTexto =
    String(datos.simulacion.etapaActualIndex) + '/' + String(datos.simulacion.totalEtapas);
  const altoStat2 =
    dibujarEstadistica(
      doc,
      margen + anchoStat + espacioEntreStats,
      yStats,
      anchoStat,
      'Duración',
      datos.simulacion.duracionFormato,
      true
    ) - yStats;
  const altoStat3 =
    dibujarEstadistica(
      doc,
      margen + (anchoStat + espacioEntreStats) * 2,
      yStats,
      anchoStat,
      'Etapas',
      etapasTexto,
      true
    ) - yStats;

  const altoMaxStats = Math.max(altoStat1, altoStat2, altoStat3);
  y += altoMaxStats + 4;

  // Segunda fila de estadísticas (Producto)
  yStats = y;
  const anchoStatProducto = (anchoUtil - espacioEntreStats) / 2;

  const altoStat4 =
    dibujarEstadistica(
      doc,
      margen,
      yStats,
      anchoStatProducto,
      'Producto',
      datos.producto.nombre,
      true
    ) - yStats;
  const altoStat5 =
    dibujarEstadistica(
      doc,
      margen + anchoStatProducto + espacioEntreStats,
      yStats,
      anchoStatProducto,
      'Categoría',
      datos.producto.categoria,
      true
    ) - yStats;

  const altoMaxStats2 = Math.max(altoStat4, altoStat5);
  y += altoMaxStats2 + 8;

  // ==================== PERFIL DEL CLIENTE ====================
  y = dibujarTituloSeccion(doc, 'Perfil del Cliente Simulado', y, pageWidth, true);

  const cliente = datos.clienteSimulado;

  // Calcular altura de la tarjeta del cliente (más compacta)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const medidaNombreCliente = medirAlturaTexto(
    doc,
    cliente.nombre,
    anchoUtil - paddingTarjeta * 2,
    10,
    1.1
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const medidaEdad = medirAlturaTexto(
    doc,
    String(cliente.edad) + ' años',
    anchoUtil - paddingTarjeta * 2,
    8.5,
    1.1
  );

  const lineasprofesion = dividirTexto(
    doc,
    String(cliente.profesion),
    anchoUtil - paddingTarjeta * 2
  );
  const alturaProfesion = lineasprofesion.length * 3;

  const infoExtra = String(cliente.genero) + ' - ' + String(cliente.nivelConocimiento);
  const lineasInfoExtra = dividirTexto(doc, infoExtra, anchoUtil - paddingTarjeta * 2);
  const alturaInfoExtra = lineasInfoExtra.length * 3;

  const altoTarjetaCliente =
    paddingTarjeta * 2 +
    medidaNombreCliente.altura +
    medidaEdad.altura +
    alturaProfesion +
    alturaInfoExtra +
    6;

  dibujarTarjeta(doc, margen, y, anchoUtil, altoTarjetaCliente, COLORES.azulClaro);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORES.texto);
  doc.text(medidaNombreCliente.lineas, margen + paddingTarjeta, y + paddingTarjeta + 3.5);

  let yCliente = y + paddingTarjeta + 3.5 + medidaNombreCliente.altura + 2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORES.textoSecundario);
  doc.text(String(cliente.edad) + ' años', margen + paddingTarjeta, yCliente);
  yCliente += 3;

  doc.text(lineasprofesion, margen + paddingTarjeta, yCliente);
  yCliente += alturaProfesion;

  doc.text(lineasInfoExtra, margen + paddingTarjeta, yCliente);

  y += altoTarjetaCliente + 6;

  // Información del cliente en UNA COLUMNA (sin concepto producto)
  const itemsCliente = [
    { label: 'Situación Actual', value: cliente.situacionActual },
    { label: 'Motivación', value: cliente.motivacion },
    { label: 'Perfil de Riesgo', value: cliente.perfilRiesgo },
    { label: 'Tipo de Cliente', value: datos.tipoCliente.tipo },
    { label: 'Perfil Asignado', value: datos.perfilCliente.nombre },
  ];

  y = dibujarSeccionInfo(doc, margen + 2, y, anchoUtil - 4, itemsCliente);

  // Dibujar pie de página en la primera página
  dibujarPiePagina(doc, pageWidth, pageHeight, numeroPagina);

  // ==================== CONVERSACIÓN (NUEVA PÁGINA SIN ENCABEZADO) ====================
  doc.addPage();
  numeroPagina++;
  y = 20; // Iniciar sin encabezado

  y = dibujarTituloSeccion(doc, 'Historial de Conversación', y, pageWidth);

  let etapaAnterior = null;

  // Crear un mapa de recomendaciones por etapa
  const recomendacionesPorEtapa = {};
  if (datos.recomendaciones?.length > 0) {
    datos.recomendaciones.forEach((rec) => {
      recomendacionesPorEtapa[rec.indiceEtapa] = rec;
    });
  }

  for (const msg of datos.conversacion) {
    const esAsesor = msg.emisor === 'Asesor';

    // Separador de etapa y recomendación
    if (msg.indiceEtapa && msg.indiceEtapa !== etapaAnterior) {
      // Calcular altura de la tarjeta de etapa
      const etapaTexto = 'ETAPA ' + String(msg.indiceEtapa) + ': ' + String(msg.nombreEtapa || '');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      const lineasEtapa = dividirTexto(doc, etapaTexto, anchoUtil - 8);
      const altoTarjetaEtapa = Math.max(14, lineasEtapa.length * 4 + 6);

      // Verificar espacio para tarjeta de etapa
      const verificacion = verificarYAgregarPagina(
        doc,
        y,
        altoTarjetaEtapa + 10,
        pageHeight,
        pageWidth,
        numeroPagina
      );
      y = verificacion.y;
      numeroPagina = verificacion.numeroPagina;

      // Tarjeta de etapa mejorada sin badge
      dibujarTarjeta(doc, margen, y, anchoUtil, altoTarjetaEtapa, COLORES.primarioClaro);

      // Nombre de etapa centrado verticalmente en la tarjeta
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...COLORES.primario);
      const yTextoEtapa = y + altoTarjetaEtapa / 2 + lineasEtapa.length * 2;
      doc.text(lineasEtapa, margen + 6, yTextoEtapa);

      y += altoTarjetaEtapa + 6;

      // Mostrar recomendación de aprendizaje para esta etapa
      const recomendacion = recomendacionesPorEtapa[msg.indiceEtapa];
      if (recomendacion && recomendacion.recomendacionParaAsesor) {
        const recLineas = dividirTexto(doc, recomendacion.recomendacionParaAsesor, anchoUtil - 12);
        const alturaRec = recLineas.length * 3.8 + 16;

        const verificacionRec = verificarYAgregarPagina(
          doc,
          y,
          alturaRec + 8,
          pageHeight,
          pageWidth,
          numeroPagina
        );
        y = verificacionRec.y;
        numeroPagina = verificacionRec.numeroPagina;

        // Tarjeta de recomendación
        dibujarTarjeta(doc, margen, y, anchoUtil, alturaRec, COLORES.verdeClaro);

        // Ícono o badge de recomendación
        doc.setFillColor(...COLORES.verde);
        doc.circle(margen + 8, y + 7, 2.5, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...COLORES.verde);
        doc.text('RECOMENDACIÓN DE APRENDIZAJE', margen + 13, y + 8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...COLORES.texto);
        doc.text(recLineas, margen + 6, y + 14);

        y += alturaRec + 6;
      }

      etapaAnterior = msg.indiceEtapa;
    }

    // Calcular altura aproximada del mensaje
    const anchoMax = pageWidth - margen * 2;
    const anchoMensaje = anchoMax * 0.72;
    const medida = medirAlturaTexto(doc, msg.mensaje, anchoMensaje - 10, 9, 1.3);
    const alturaEstimada = medida.altura + 22;

    // Verificar si necesita nueva página
    const verificacionMsg = verificarYAgregarPagina(
      doc,
      y,
      alturaEstimada,
      pageHeight,
      pageWidth,
      numeroPagina
    );
    y = verificacionMsg.y;
    numeroPagina = verificacionMsg.numeroPagina;

    // Dibujar mensaje
    const alturaUsada = dibujarMensajeChat(doc, msg, y, pageWidth, margen, esAsesor);
    y += alturaUsada;
  }

  // Dibujar pie de página en la última página de conversación
  dibujarPiePagina(doc, pageWidth, pageHeight, numeroPagina);

  // ==================== ANÁLISIS DE DESEMPEÑO (SI EXISTE) ====================
  if (datos.analisisDesempeno && !datos.analisisDesempeno.error) {
    doc.addPage();
    numeroPagina++;
    y = 20; // Sin encabezado

    y = dibujarTituloSeccion(doc, 'Análisis de Desempeño', y, pageWidth);

    const analisis = datos.analisisDesempeno;

    // Puntuación destacada
    if (analisis.puntuacion_cualitativa) {
      const altoBadge = 20;

      const verificacion = verificarYAgregarPagina(
        doc,
        y,
        altoBadge + 5,
        pageHeight,
        pageWidth,
        numeroPagina
      );
      y = verificacion.y;
      numeroPagina = verificacion.numeroPagina;

      dibujarTarjeta(doc, margen, y, anchoUtil, altoBadge, COLORES.verde);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...COLORES.blanco);
      doc.text('CALIFICACIÓN OBTENIDA', margen + 6, y + 8);

      doc.setFontSize(12);
      const puntuacionLineas = dividirTexto(doc, analisis.puntuacion_cualitativa, anchoUtil - 12);
      doc.text(puntuacionLineas, margen + 6, y + 15);

      y += altoBadge + 12;
    }

    // Resumen general
    if (analisis.resumen_general) {
      const resumenLineas = dividirTexto(doc, analisis.resumen_general, anchoUtil);
      const alturaResumen = resumenLineas.length * 3.8 + 12;

      const verificacion = verificarYAgregarPagina(
        doc,
        y,
        alturaResumen + 10,
        pageHeight,
        pageWidth,
        numeroPagina
      );
      y = verificacion.y;
      numeroPagina = verificacion.numeroPagina;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...COLORES.primario);
      doc.text('RESUMEN GENERAL', margen, y);
      y += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...COLORES.texto);
      doc.text(resumenLineas, margen, y);

      y += resumenLineas.length * 3.8 + 12;
    }

    // Fortalezas
    if (analisis.fortalezas?.length > 0) {
      const verificacion = verificarYAgregarPagina(doc, y, 25, pageHeight, pageWidth, numeroPagina);
      y = verificacion.y;
      numeroPagina = verificacion.numeroPagina;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...COLORES.verde);
      doc.text('FORTALEZAS IDENTIFICADAS', margen, y);
      y += 7;

      analisis.fortalezas.forEach((fortaleza) => {
        const lineas = dividirTexto(doc, '• ' + String(fortaleza), anchoUtil - 4);
        const alturaItem = lineas.length * 3.8 + 3;

        const verificacionItem = verificarYAgregarPagina(
          doc,
          y,
          alturaItem + 5,
          pageHeight,
          pageWidth,
          numeroPagina
        );
        y = verificacionItem.y;
        numeroPagina = verificacionItem.numeroPagina;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...COLORES.texto);
        doc.text(lineas, margen + 2, y);
        y += alturaItem;
      });

      y += 10;
    }

    // Áreas de mejora
    if (analisis.areas_mejora?.length > 0) {
      const verificacion = verificarYAgregarPagina(doc, y, 25, pageHeight, pageWidth, numeroPagina);
      y = verificacion.y;
      numeroPagina = verificacion.numeroPagina;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...COLORES.naranja);
      doc.text('ÁREAS DE MEJORA', margen, y);
      y += 7;

      analisis.areas_mejora.forEach((area) => {
        const lineas = dividirTexto(doc, '• ' + String(area), anchoUtil - 4);
        const alturaItem = lineas.length * 3.8 + 3;

        const verificacionItem = verificarYAgregarPagina(
          doc,
          y,
          alturaItem + 5,
          pageHeight,
          pageWidth,
          numeroPagina
        );
        y = verificacionItem.y;
        numeroPagina = verificacionItem.numeroPagina;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...COLORES.texto);
        doc.text(lineas, margen + 2, y);
        y += alturaItem;
      });
    }

    // Dibujar pie de página en la última página de análisis
    dibujarPiePagina(doc, pageWidth, pageHeight, numeroPagina);
  }

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
