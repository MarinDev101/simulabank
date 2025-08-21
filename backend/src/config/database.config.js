const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Se crea un pool de conexiones reutilizables con la base de datos
const pool = mysql.createPool({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  waitForConnections: true, // Espera cuando todas las conexiones están ocupadas
  connectionLimit: 10, // Límite de conexiones simultáneas
  queueLimit: 0, // Sin límite de espera en la cola
});

//Funcion para verificar si el backend se puede conectar a la base de datos
async function validateConnectionBD() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.ping();
    console.log('¡Conexión exitosa a la base de datos!');
  } catch (error) {
    console.error('{db error}', error);
  } finally {
    if (connection) connection.release();
  }
}

// Exporta el pool y la función conectarBD
module.exports = { pool, validateConnectionBD };
