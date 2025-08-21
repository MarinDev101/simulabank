const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const CrudController = require('../controllers/crud.controller');

function crearCrudRouter(tabla, idCampo) {
    const router = express.Router();
    const crud = new CrudController(tabla, idCampo);

    router.get('/', asyncHandler(async (req, res) => {
        const { page, limit, sortBy, order, ...filters } = req.query;
        res.json(await crud.obtenerTodos({ page, limit, sortBy, order, filters }));
    }));

    router.get('/:id', asyncHandler(async (req, res) => {
        res.json(await crud.obtenerUno(req.params.id));
    }));

    router.post('/', asyncHandler(async (req, res) => {
        res.status(201).json(await crud.crear(req.body));
    }));

    router.put('/:id', asyncHandler(async (req, res) => {
        res.json(await crud.actualizar(req.params.id, req.body));
    }));

    router.delete('/:id', asyncHandler(async (req, res) => {
        res.json(await crud.eliminar(req.params.id));
    }));

    return router;
}

module.exports = crearCrudRouter;
