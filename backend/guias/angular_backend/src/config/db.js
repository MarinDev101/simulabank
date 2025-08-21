// se importa la version de mysql2 que trabaja con promesas (mejor utilidad para async/await)
const mysql = require('mysql2/promise');

// Importar dotenv para manejar variables de entorno desde un archivo .env
const dotenv = require('dotenv'); /* dotenv permite leer valores como usuario, contraseña o nombre
de base de datos desde un archivo .env, y asi evitar poner informacion sensible directamente en el codigo*/

// Cargar las variables de entorno definidas en .env
dotenv.config(); /* Esta linea lee el archivo .env y carga sus valores en process.env por ejemplo
, process.env.DB_USER */

/* se crea un "pool" de conexiones a la base de datos. createPool() crea un grupo de conexiones
reutilizables, lo cual es mas eficiente que abrir y cerrar una conexion para cada consulta */
const pool = mysql.createPool({
  host: process.env.DB_HOST,              // Host donde esta la base de datos
  user: process.env.DB_USER,              // Usuario de la base de datos
  password: process.env.DB_PASSWORD,      // Contraseña de la base de datos
  database: process.env.DB_NAME,          // Nombre de la base de datos
  waitForConnections: true,               // Espera cuando todas las conexiones estan ocupadas
  connectionLimit: 10,                    // Limite de conexiones al mismo tiempo
  queueLimit: 0                           // No hay limite de espera en la cola
});

/* Las variables host, user, entre otras; viene del archivo .env,
lo que hace que el codigo sea mas seguro y configurable */

module.exports = pool;