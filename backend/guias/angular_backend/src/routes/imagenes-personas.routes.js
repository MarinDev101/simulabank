const express = require('express');
const router = express.Router();
const imagenesPersonasController = require('../controllers/imagenes-personas.controller');

router.put('/subir/:id', imagenesPersonasController.subirImagen);
router.get('/obtener/:id', imagenesPersonasController.obtenerImagen);
router.delete('/eliminar/:id', imagenesPersonasController.eliminarImagen);
router.post('/insertar/:id', imagenesPersonasController.insertarImagen);

module.exports = router;
