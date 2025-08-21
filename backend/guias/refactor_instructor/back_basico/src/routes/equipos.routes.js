const express = require('express');
const router = express.Router();
const CrudController = require('../controllers/crud.controller');

const crud = new CrudController();

const tabla = 'equipos';
const idCampo = 'id_equipo';

// Rutas para operaciones CRUD
router.get('/', async(req, res) => {
    try {
        const datos = await crud.obtenerTodos(tabla);
        res.json(datos);
    } catch (error) {
        console.error('Error al obtener los equipos:', error);
        res.status(500).json({ message: 'Error al obtener los equipos', error });
    }
});

router.get('/:id', async(req, res) => {
    try {
        const dato = await crud.obtenerUno(tabla, idCampo, req.params.id);
        res.json(dato);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async(req, res) => {
    try {
        const nuevoDato = await crud.crear(tabla, req.body);
        res.status(201).json(nuevoDato);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', async(req, res) => {
    try {
        const datoActualizado = await crud.actualizar(tabla, idCampo, req.params.id, req.body);
        res.json(datoActualizado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', async(req, res) => {
    try { 
        const id = req.params.id;
        const resultado = await crud.eliminar(tabla, idCampo, id);
        res.json(resultado);
    }catch (error) {
        if (error.message.includes('Registro no encontrado')) {
            res.status(404).json({ error: 'dato no encontrado' });
        } else {
            res.status(500).json({ error: 'Error al eliminar el dato' + error.message });
        }
    }   
});

module.exports = router;