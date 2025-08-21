const express = require('express');
const cors = require('cors');
const path = require('path');

const crearCrudRouter = require('./routes/crud.routes'); // Importa tu creador de rutas

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rutas usando CRUD genérico
app.use('/api/equipos', crearCrudRouter('equipos', 'id_equipo')); // Cambiado
// Si quieres más tablas:
// app.use('/api/usuarios', crearCrudRouter('usuarios', 'id_usuario'));
// app.use('/api/productos', crearCrudRouter('productos', 'id_producto'));

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: err.message });
});

module.exports = app;
