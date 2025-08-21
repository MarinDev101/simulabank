// Se importa la configuracion principal de la aplicacion desde el archivo app.js ubicado en la carpeta src
const app = require('./src/app');

// Se cargan las variables de entorno definidas en el archivo .env
require('dotenv').config();

// Se define el puerto en el que se ejecutara el servidor. si no hay una variable de entorno PORT, usara el 3000 por defecto
const PORT = process.env.PORT || 3000;

// Se inicia el servidor en el puerto especificado y muestra un mensaje en consola cuando este corriendo correctamente
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});