const jsPdfConfig = require('../config/jspdf.config');
const fs = require('fs');
const path = require('path');

// Paleta de colores diversificada y más armónica
// `primario` es una aproximación al OKLCH pedido; el resto busca contraste y variantes para secciones
const COLORES = {
  primario: [28, 35, 70], // encabezado - azul profundo
  primarioOscuro: [16, 20, 44],
  primarioClaro: [236, 243, 255],
  titulo: [12, 97, 177], // color para títulos y acentos
  texto: [23, 33, 52],
  textoSecundario: [94, 101, 115],
  textoClaro: [120, 130, 140],
  blanco: [255, 255, 255],
  fondoGris: [250, 251, 253],
  fondoGrisOscuro: [245, 246, 248],
  linea: [230, 232, 235],
  lineaOscura: [150, 160, 170],
  azulClaro: [235, 242, 255],
  mensajeAsesorFondo: [232, 241, 254],
  mensajeClienteFondo: [248, 249, 250],
  verdeClaro: [237, 252, 242],
  verde: [16, 185, 129],
  naranja: [249, 115, 22],
  amarillo: [249, 204, 36],
  morado: [99, 102, 241],
  recomendacionFondo: [237, 249, 237],
  recomendacion: [34, 197, 94],
  fortalezasTitulo: [6, 78, 59],
  areasTitulo: [185, 65, 12],
  tarjetaFondo: [245, 249, 255],
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
  doc.setTextColor(...COLORES.titulo);
  const lineasTitulo = dividirTexto(doc, titulo, anchoUtil);
  doc.text(lineasTitulo, margen, y);

  const alturaUsada = lineasTitulo.length * (compacto ? 3.8 : 4.2);

  // Línea decorativa
  doc.setDrawColor(...COLORES.titulo);
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
 * Calcula la altura aproximada que ocuparán un conjunto de items en una columna
 */
function calcularAlturaItems(
  doc,
  items,
  ancho,
  labelFontSize = 7,
  valueFontSize = 8.5,
  spacing = 3
) {
  let altura = 0;
  items.forEach((item, index) => {
    if (index > 0) altura += spacing;

    const medidaLabel = medirAlturaTexto(
      doc,
      String(item.label || '').toUpperCase(),
      ancho,
      labelFontSize,
      1.1
    );
    const medidaValor = medirAlturaTexto(
      doc,
      String(item.value || 'N/A'),
      ancho,
      valueFontSize,
      1.15
    );

    altura += medidaLabel.altura + medidaValor.altura + 2; // padding pequeño
  });
  return altura;
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
  const colorFondo = esAsesor ? COLORES.mensajeAsesorFondo : COLORES.mensajeClienteFondo;
  doc.setFillColor(...colorFondo);
  doc.rect(xInicio, y, anchoMensaje, alturaMensaje, 'F');

  // Borde del mensaje
  const colorBorde = esAsesor ? COLORES.titulo : COLORES.linea;
  doc.setDrawColor(...colorBorde);
  doc.setLineWidth(0.5);
  doc.rect(xInicio, y, anchoMensaje, alturaMensaje, 'S');

  // Etiqueta del emisor
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...(esAsesor ? COLORES.morado : COLORES.textoSecundario));
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

  // Presentar Resumen de Simulación como una lista etiquetada (estilo Perfil del Cliente)
  const itemsResumen = [
    { label: 'Aprendiz', value: datos.aprendiz.nombreCompleto || 'N/A' },
    { label: 'Correo', value: datos.aprendiz?.correo || 'N/A' },
    { label: 'Modo', value: datos.simulacion.modo || 'N/A' },
    { label: 'Duración', value: datos.simulacion.duracionFormato || 'N/A' },
    {
      label: 'Etapas',
      value:
        String(datos.simulacion.etapaActualIndex || '') +
        '/' +
        String(datos.simulacion.total_etapas || datos.simulacion.totalEtapas || ''),
    },
    { label: 'Producto', value: datos.producto?.nombre || 'N/A' },
    { label: 'Categoría', value: datos.producto?.categoria || 'N/A' },
  ];

  // Dibujar en dos columnas para aprovechar mejor el espacio
  const gapCols = 8;
  const colWidth = Math.floor((anchoUtil - gapCols) / 2);

  // Dividir items en dos columnas (mitad superior/mitad inferior) intentando balancear
  const mitad = Math.ceil(itemsResumen.length / 2);
  const leftItems = itemsResumen.slice(0, mitad);
  const rightItems = itemsResumen.slice(mitad);

  const alturaLeft = calcularAlturaItems(doc, leftItems, colWidth - 6);
  const alturaRight = calcularAlturaItems(doc, rightItems, colWidth - 6);
  const alturaNecesaria = Math.max(alturaLeft, alturaRight) + 6;

  const verif = verificarYAgregarPagina(
    doc,
    y,
    alturaNecesaria + 8,
    pageHeight,
    pageWidth,
    numeroPagina
  );
  y = verif.y;
  numeroPagina = verif.numeroPagina;

  // Dibujar columnas
  const xLeft = margen + 2;
  const xRight = margen + 2 + colWidth + gapCols;

  const yLeftFin = dibujarSeccionInfo(doc, xLeft, y, colWidth, leftItems);
  const yRightFin = dibujarSeccionInfo(doc, xRight, y, colWidth, rightItems);

  y = Math.max(yLeftFin, yRightFin) + 8;

  // ==================== PERFIL DEL CLIENTE ====================
  y = dibujarTituloSeccion(doc, 'Perfil del Cliente Simulado', y, pageWidth, true);

  const cliente = datos.clienteSimulado;
  // (Se removió la tarjeta azul 'CLIENTE SIMULADO' para mostrar directamente los datos)
  y += 2;

  // Información del cliente en UNA COLUMNA (sin concepto producto)
  // Presentar todos los datos del cliente como items (igual que el resto de la sección)
  const itemsCliente = [
    { label: 'Nombre', value: cliente.nombre },
    { label: 'Edad', value: String(cliente.edad) ? String(cliente.edad) + ' años' : 'N/A' },
    { label: 'Profesión', value: cliente.profesion },
    { label: 'Género', value: cliente.genero },
    { label: 'Situación Actual', value: cliente.situacionActual },
    { label: 'Motivación', value: cliente.motivacion },
    { label: 'Perfil de Riesgo', value: cliente.perfilRiesgo },
    { label: 'Tipo de Cliente', value: datos.tipoCliente.tipo },
    { label: 'Perfil Asignado', value: datos.perfilCliente.nombre },
    { label: 'Nivel de Conocimiento', value: cliente.nivelConocimiento },
    { label: 'Objetivo', value: cliente.objetivo },
    { label: 'Escenario Narrativo', value: cliente.escenarioNarrativo },
  ];
  // Dibujar perfil del cliente en dos columnas
  const gapColsC = 8;
  const colWidthC = Math.floor((anchoUtil - gapColsC) / 2);
  const mitadC = Math.ceil(itemsCliente.length / 2);
  const leftCliente = itemsCliente.slice(0, mitadC);
  const rightCliente = itemsCliente.slice(mitadC);

  const alturaLeftC = calcularAlturaItems(doc, leftCliente, colWidthC - 6);
  const alturaRightC = calcularAlturaItems(doc, rightCliente, colWidthC - 6);
  const alturaNecesariaC = Math.max(alturaLeftC, alturaRightC) + 6;

  const verifC = verificarYAgregarPagina(
    doc,
    y,
    alturaNecesariaC + 8,
    pageHeight,
    pageWidth,
    numeroPagina
  );
  y = verifC.y;
  numeroPagina = verifC.numeroPagina;

  const xLeftC = margen + 2;
  const xRightC = margen + 2 + colWidthC + gapColsC;

  const yLeftFinC = dibujarSeccionInfo(doc, xLeftC, y, colWidthC, leftCliente);
  const yRightFinC = dibujarSeccionInfo(doc, xRightC, y, colWidthC, rightCliente);

  y = Math.max(yLeftFinC, yRightFinC) + 8;

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
      // Construir título de etapa e incluir el objetivo de la etapa al lado del nombre
      const etapasArray = datos.etapas || [];
      const etapaObj = etapasArray.find(
        (e) =>
          e.numero_orden == msg.indiceEtapa ||
          e.id_etapa_conversacion == msg.indiceEtapa ||
          String(e.nombre).trim() === String(msg.nombreEtapa).trim()
      );
      const objetivoEtapa = etapaObj?.objetivo;
      let etapaTexto = 'ETAPA ' + String(msg.indiceEtapa) + ': ' + String(msg.nombreEtapa || '');
      if (objetivoEtapa) etapaTexto += ' — Objetivo: ' + String(objetivoEtapa);

      // Usar mediciones para evitar desbordes: medir altura real del bloque
      doc.setFont('helvetica', 'bold');
      const fontSizeEtapa = 9.5;
      doc.setFontSize(fontSizeEtapa);
      const medidaEtapa = medirAlturaTexto(doc, etapaTexto, anchoUtil - 12, fontSizeEtapa, 1.12);
      const paddingEtapa = 8;
      const altoTarjetaEtapa = Math.max(14, medidaEtapa.altura + paddingEtapa * 2);

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

      // Nombre de etapa en la parte superior de la tarjeta con padding
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fontSizeEtapa);
      doc.setTextColor(...COLORES.titulo);
      doc.text(medidaEtapa.lineas, margen + 8, y + paddingEtapa + fontSizeEtapa * 0.352778);

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

        // Tarjeta de recomendación (fondo suave y color de acento)
        dibujarTarjeta(doc, margen, y, anchoUtil, alturaRec, COLORES.recomendacionFondo);

        // Ícono o badge de recomendación
        doc.setFillColor(...COLORES.recomendacion);
        doc.circle(margen + 8, y + 7, 2.5, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...COLORES.recomendacion);
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

    // Puntuación destacada (mostrar como texto simple, sin tarjeta)
    if (analisis.puntuacion_cualitativa) {
      const fontSizeTituloPunt = 9;
      const paddingPunt = 6;
      const maxWidthPunt = anchoUtil - paddingPunt * 2;
      const medidaPunt = medirAlturaTexto(
        doc,
        analisis.puntuacion_cualitativa,
        maxWidthPunt,
        12,
        1.15
      );
      const alturaPunt = medidaPunt.altura + paddingPunt * 2;

      const verificacion = verificarYAgregarPagina(
        doc,
        y,
        alturaPunt + 10,
        pageHeight,
        pageWidth,
        numeroPagina
      );
      y = verificacion.y;
      numeroPagina = verificacion.numeroPagina;

      // Mostrar en una sola línea: 'CALIFICACIÓN OBTENIDA: <valor>'
      const labelPunt = 'CALIFICACIÓN OBTENIDA: ';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fontSizeTituloPunt);
      doc.setTextColor(...COLORES.titulo);
      // dibujar etiqueta
      const yLinea = y + 7;
      doc.text(labelPunt, margen, yLinea);
      // ancho de la etiqueta para posicionar el valor a la derecha inmediato
      const labelWidth = typeof doc.getTextWidth === 'function' ? doc.getTextWidth(labelPunt) : 0;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(...COLORES.morado);
      // Escribir la puntuación justo después de la etiqueta
      doc.text(String(analisis.puntuacion_cualitativa || ''), margen + labelWidth + 4, yLinea);

      y += Math.max(alturaPunt, 12) + 6;
    }

    // Resumen general (usar todo el ancho disponible y calcular altura real)
    if (analisis.resumen_general) {
      const fontSizeResumen = 9;
      const paddingResumen = 6;
      const maxWidthResumen = anchoUtil - paddingResumen * 2;
      const medidaResumen = medirAlturaTexto(
        doc,
        analisis.resumen_general,
        maxWidthResumen,
        fontSizeResumen,
        1.15
      );
      const alturaResumen = medidaResumen.altura + paddingResumen * 2;

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
      doc.setTextColor(...COLORES.titulo);
      doc.text('RESUMEN GENERAL', margen, y);
      y += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSizeResumen);
      doc.setTextColor(...COLORES.texto);
      // Dibujar usando el ancho completo (con padding interno)
      doc.text(medidaResumen.lineas, margen + paddingResumen, y + paddingResumen / 2);

      y += alturaResumen + 6;
    }

    // Fortalezas
    if (analisis.fortalezas?.length > 0) {
      const verificacion = verificarYAgregarPagina(doc, y, 25, pageHeight, pageWidth, numeroPagina);
      y = verificacion.y;
      numeroPagina = verificacion.numeroPagina;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...COLORES.fortalezasTitulo);
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
      doc.setTextColor(...COLORES.areasTitulo);
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
