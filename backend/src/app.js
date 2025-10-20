// Configuración base de la aplicación
const logger = require('./utils/logger');
const createExpressApp = require('./config/express.config');
const { validateConnectionBD } = require('./config/database.config');
const errorHandler = require('./middlewares/error.middleware');
const routes = require('./routes/routes.main');

// Inicializa la aplicación de Express
const app = createExpressApp();

// Rutas de diagnóstico
app.get('/', (_, res) => {
  res.status(200).json({ message: 'Servidor funcionando correctamente.' });
});

app.get('/health', async (_, res) => {
  try {
    await validateConnectionBD();
    res.status(200).json({ status: 'ok', database: true });
  } catch (error) {
    logger.error('[HEALTH] Error al conectar con la BD:', error);
    res.status(500).json({ status: 'error', database: false });
  }
});

// Rutas principales
app.use('/api', routes);

// Manejo de rutas inexistentes (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Ruta no encontrada: ${req.originalUrl}`,
  });
});

// Middleware global de manejo de errores
app.use(errorHandler);

// Exporta la aplicación
module.exports = app;
