const express = require('express');
const cors = require('cors');
const app = express();
const imagenesPersonasRoutes = require('./routes/imagenes-personas.routes');
const personasRoutes = require('./routes/personas.routes');
const usuariosRoutes = require('./routes/usuarios.routes');

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rutas
app.use('/api/imagenes-personas', imagenesPersonasRoutes);
app.use('/api/personas', personasRoutes);
app.use('/api/usuarios', usuariosRoutes);

module.exports = app;
