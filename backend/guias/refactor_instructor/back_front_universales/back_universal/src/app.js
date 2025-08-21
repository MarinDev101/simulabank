const express = require('express');
const cors = require('cors');
const db = require('./config/conexion_DB');
const crearCrudRouter = require('./routes/crud.routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Endpoint de metadatos
app.get('/api/:tabla/meta', async (req, res) => {
    const tabla = req.params.tabla;
    try {
        const [pkRows] = await db.query(`SHOW KEYS FROM ?? WHERE Key_name = 'PRIMARY'`, [tabla]);
        if (!pkRows.length) {
            return res.status(404).json({ error: `No se encontró clave primaria para ${tabla}` });
        }
        const idCampo = pkRows[0].Column_name;
        const [columns] = await db.query(`SHOW COLUMNS FROM ??`, [tabla]);

        res.json({
            tabla,
            idCampo,
            columnas: columns.map(c => c.Field)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta universal CRUD
app.use('/api/:tabla', async (req, res, next) => {
    const tabla = req.params.tabla;
    try {
        const [rows] = await db.query(`SHOW KEYS FROM ?? WHERE Key_name = 'PRIMARY'`, [tabla]);
        if (rows.length === 0) {
            return res.status(404).json({ error: `No se encontró clave primaria para la tabla ${tabla}` });
        }
        const idCampo = rows[0].Column_name;
        return crearCrudRouter(tabla, idCampo)(req, res, next);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: `Error obteniendo clave primaria de ${tabla}: ${err.message}` });
    }
});

// Manejo global de errores
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: err.message });
});

module.exports = app;
