const express = require('express');
const router = express.Router();
const personasController = require('../controllers/personas.controller');

router.get('/', personasController.obtenerTodos);
router.get('/:id', personasController.obtenerUno);
router.post('/', personasController.crear);
router.put('/:id', personasController.actualizar);
router.delete('/:id', personasController.eliminar);

module.exports = router;
