const express = require('express');
const cors = require('cors');
const path = require('path');

const crearCrudRouter = require('./routes/crud.routes');
const tablasConfig = require('./config/tablas');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ruta dinámica para cualquier tabla registrada
app.use('/api/:tabla', (req, res, next) => {
    const tabla = req.params.tabla;
    const idCampo = tablasConfig[tabla];

    if (!idCampo) {
        return res.status(404).json({ error: 'Tabla no registrada en la configuración' });
    }

    // Creamos y usamos el CRUD dinámicamente
    return crearCrudRouter(tabla, idCampo)(req, res, next);
});

// Middleware global de errores
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: err.message });
});

module.exports = app;
