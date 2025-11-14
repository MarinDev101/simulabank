// =========================================================
// Script para poblar la base de datos con información inicial
// =========================================================
const { pool, validateConnectionBD, closePool } = require('../../src/config/database.config');

// Importar los datos desde los archivos constants
const PRODUCTOS_BANCARIOS = require('../informacion-simulacion/productosBancarios.constants');
const TIPOS_CLIENTES = require('../informacion-simulacion/tiposClientes.constants');
const PERFILES_CLIENTES = require('../informacion-simulacion/perfilesClientes.constants');
const ETAPAS_PRODUCTOS = require('../informacion-simulacion/etapasConversacion.constants');

// =========================================================
// Logger simple para el script
// =========================================================
const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  success: (msg) => console.log(`[SUCCESS] ${new Date().toISOString()} - ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`),
};

// =========================================================
// Funciones auxiliares
// =========================================================

/**
 * Inserta productos bancarios
 */
async function insertarProductosBancarios() {
  logger.info('Insertando productos bancarios...');
  const connection = await pool.getConnection();

  try {
    let insertados = 0;
    let omitidos = 0;

    for (const [nombre, datos] of Object.entries(PRODUCTOS_BANCARIOS)) {
      // Verificar si el producto ya existe
      const [existe] = await connection.query(
        'SELECT id_producto_bancario FROM productos_bancarios WHERE nombre = ?',
        [nombre]
      );

      if (existe.length > 0) {
        logger.warn(`Producto "${nombre}" ya existe. Omitiendo...`);
        omitidos++;
        continue;
      }

      // Insertar producto
      await connection.query(
        `INSERT INTO productos_bancarios
        (nombre, categoria, concepto, caracteristicas, beneficios, requisitos)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          nombre,
          datos.categoria,
          datos.concepto,
          JSON.stringify(datos.caracteristicas),
          JSON.stringify(datos.beneficios),
          JSON.stringify(datos.requisitos),
        ]
      );
      insertados++;
      logger.success(`Producto "${nombre}" insertado correctamente`);
    }

    logger.success(`Productos bancarios: ${insertados} insertados, ${omitidos} omitidos`);
  } catch (error) {
    logger.error(`Error al insertar productos bancarios: ${error.message}`);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Inserta tipos de clientes
 */
async function insertarTiposClientes() {
  logger.info('Insertando tipos de clientes...');
  const connection = await pool.getConnection();

  try {
    let insertados = 0;
    let omitidos = 0;

    for (const tipoCliente of TIPOS_CLIENTES) {
      // Verificar si el tipo ya existe
      const [existe] = await connection.query(
        'SELECT id_tipo_cliente FROM tipos_clientes WHERE tipo = ?',
        [tipoCliente.tipo]
      );

      if (existe.length > 0) {
        logger.warn(`Tipo de cliente "${tipoCliente.tipo}" ya existe. Omitiendo...`);
        omitidos++;
        continue;
      }

      // Insertar tipo de cliente
      await connection.query('INSERT INTO tipos_clientes (tipo, actua, ejemplo) VALUES (?, ?, ?)', [
        tipoCliente.tipo,
        tipoCliente.actua,
        tipoCliente.ejemplo,
      ]);
      insertados++;
      logger.success(`Tipo de cliente "${tipoCliente.tipo}" insertado correctamente`);
    }

    logger.success(`Tipos de clientes: ${insertados} insertados, ${omitidos} omitidos`);
  } catch (error) {
    logger.error(`Error al insertar tipos de clientes: ${error.message}`);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Inserta perfiles de clientes y sus relaciones con productos
 */
async function insertarPerfilesClientes() {
  logger.info('Insertando perfiles de clientes...');
  const connection = await pool.getConnection();

  try {
    let insertados = 0;
    let omitidos = 0;
    let relacionesCreadas = 0;

    for (const [nombre, datos] of Object.entries(PERFILES_CLIENTES)) {
      // Verificar si el perfil ya existe
      const [existe] = await connection.query(
        'SELECT id_perfil_cliente FROM perfiles_clientes WHERE nombre = ?',
        [nombre]
      );

      let idPerfil;

      if (existe.length > 0) {
        logger.warn(`Perfil de cliente "${nombre}" ya existe. Omitiendo inserción...`);
        idPerfil = existe[0].id_perfil_cliente;
        omitidos++;
      } else {
        // Insertar perfil de cliente
        const [result] = await connection.query(
          `INSERT INTO perfiles_clientes
          (nombre, tipo_cliente, rango_cop, enfoque_atencion)
          VALUES (?, ?, ?, ?)`,
          [nombre, datos.tipo_cliente, datos.rango_cop, datos.enfoque_atencion]
        );
        idPerfil = result.insertId;
        insertados++;
        logger.success(`Perfil de cliente "${nombre}" insertado correctamente`);
      }

      // Insertar relaciones con productos
      if (datos.productos && datos.productos.length > 0) {
        for (const nombreProducto of datos.productos) {
          // Obtener ID del producto
          const [producto] = await connection.query(
            'SELECT id_producto_bancario FROM productos_bancarios WHERE nombre = ?',
            [nombreProducto]
          );

          if (producto.length === 0) {
            logger.warn(`Producto "${nombreProducto}" no encontrado para perfil "${nombre}"`);
            continue;
          }

          const idProducto = producto[0].id_producto_bancario;

          // Verificar si la relación ya existe
          const [relacionExiste] = await connection.query(
            'SELECT * FROM perfiles_productos WHERE id_perfil_cliente = ? AND id_producto_bancario = ?',
            [idPerfil, idProducto]
          );

          if (relacionExiste.length === 0) {
            await connection.query(
              'INSERT INTO perfiles_productos (id_perfil_cliente, id_producto_bancario) VALUES (?, ?)',
              [idPerfil, idProducto]
            );
            relacionesCreadas++;
          }
        }
      }
    }

    logger.success(`Perfiles de clientes: ${insertados} insertados, ${omitidos} omitidos`);
    logger.success(`Relaciones perfil-producto: ${relacionesCreadas} creadas`);
  } catch (error) {
    logger.error(`Error al insertar perfiles de clientes: ${error.message}`);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Inserta etapas de conversación para cada producto
 */
async function insertarEtapasConversacion() {
  logger.info('Insertando etapas de conversación...');
  const connection = await pool.getConnection();

  try {
    let insertados = 0;
    let omitidos = 0;

    for (const [nombreProducto, etapas] of Object.entries(ETAPAS_PRODUCTOS)) {
      // Obtener ID del producto
      const [producto] = await connection.query(
        'SELECT id_producto_bancario FROM productos_bancarios WHERE nombre = ?',
        [nombreProducto]
      );

      if (producto.length === 0) {
        logger.warn(`Producto "${nombreProducto}" no encontrado. Omitiendo etapas...`);
        continue;
      }

      const idProducto = producto[0].id_producto_bancario;

      for (const etapa of etapas) {
        // Verificar si la etapa ya existe
        const [existe] = await connection.query(
          `SELECT id_etapa_conversacion FROM etapas_conversacion
          WHERE id_producto_bancario = ? AND numero_orden = ?`,
          [idProducto, etapa.numero_orden]
        );

        if (existe.length > 0) {
          logger.warn(
            `Etapa ${etapa.numero_orden} "${etapa.nombre}" para "${nombreProducto}" ya existe. Omitiendo...`
          );
          omitidos++;
          continue;
        }

        // Insertar etapa
        await connection.query(
          `INSERT INTO etapas_conversacion
          (id_producto_bancario, numero_orden, nombre, objetivo, quien_inicia,
          validaciones, sugerencias_aprendizaje, instrucciones_ia_cliente)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            idProducto,
            etapa.numero_orden,
            etapa.nombre,
            etapa.objetivo,
            etapa.quien_inicia,
            JSON.stringify(etapa.validaciones),
            JSON.stringify(etapa.sugerencias_aprendizaje),
            JSON.stringify(etapa.instrucciones_ia_cliente),
          ]
        );
        insertados++;
        logger.success(
          `Etapa ${etapa.numero_orden} "${etapa.nombre}" para "${nombreProducto}" insertada`
        );
      }
    }

    logger.success(`Etapas de conversación: ${insertados} insertadas, ${omitidos} omitidas`);
  } catch (error) {
    logger.error(`Error al insertar etapas de conversación: ${error.message}`);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Muestra un resumen de los datos en la base de datos
 */
async function mostrarResumen() {
  logger.info('Generando resumen de datos insertados...');
  const connection = await pool.getConnection();

  try {
    const [productos] = await connection.query('SELECT COUNT(*) as total FROM productos_bancarios');
    const [tipos] = await connection.query('SELECT COUNT(*) as total FROM tipos_clientes');
    const [perfiles] = await connection.query('SELECT COUNT(*) as total FROM perfiles_clientes');
    const [relaciones] = await connection.query('SELECT COUNT(*) as total FROM perfiles_productos');
    const [etapas] = await connection.query('SELECT COUNT(*) as total FROM etapas_conversacion');

    logger.info('='.repeat(60));
    logger.info('RESUMEN DE DATOS EN LA BASE DE DATOS:');
    logger.info('='.repeat(60));
    logger.info(`Productos bancarios:        ${productos[0].total}`);
    logger.info(`Tipos de clientes:          ${tipos[0].total}`);
    logger.info(`Perfiles de clientes:       ${perfiles[0].total}`);
    logger.info(`Relaciones perfil-producto: ${relaciones[0].total}`);
    logger.info(`Etapas de conversación:     ${etapas[0].total}`);
    logger.info('='.repeat(60));
  } catch (error) {
    logger.error(`Error al generar resumen: ${error.message}`);
  } finally {
    connection.release();
  }
}

// =========================================================
// Función principal
// =========================================================
async function poblarBaseDatos() {
  logger.info('='.repeat(60));
  logger.info('INICIANDO PROCESO DE POBLACIÓN DE BASE DE DATOS');
  logger.info('='.repeat(60));

  try {
    // Validar conexión
    await validateConnectionBD();

    // Insertar datos en orden (respetando dependencias)
    await insertarProductosBancarios();
    await insertarTiposClientes();
    await insertarPerfilesClientes();
    await insertarEtapasConversacion();

    // Mostrar resumen
    await mostrarResumen();

    logger.success('='.repeat(60));
    logger.success('PROCESO COMPLETADO EXITOSAMENTE');
    logger.success('='.repeat(60));
  } catch (error) {
    logger.error('='.repeat(60));
    logger.error(`PROCESO FALLIDO: ${error.message}`);
    logger.error('='.repeat(60));
    throw error;
  } finally {
    await closePool();
    logger.info('Conexión cerrada. Script finalizado.');
  }
}

// =========================================================
// Ejecutar script
// =========================================================
if (require.main === module) {
  poblarBaseDatos()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error(`Error fatal: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { poblarBaseDatos };
