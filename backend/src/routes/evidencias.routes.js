const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const evidenciasController = require('../controllers/evidencias.controller');

// Middlewares
const { authenticateJWT } = require('../middlewares/jwt.middleware');

// Validadores
const { validarAprendiz } = require('../validators/user.validator');

function crearEvidenciasRouter() {
  const router = express.Router();

  router.get(
    '/listar',
    authenticateJWT,
    validarAprendiz,
    asyncHandler(evidenciasController.listarEvidencias)
  );

  router.get(
    '/ver/:id_simulacion',
    authenticateJWT,
    validarAprendiz,
    asyncHandler(evidenciasController.verEvidencia)
  );

  router.get(
    '/descargar/:id_simulacion',
    authenticateJWT,
    validarAprendiz,
    asyncHandler(evidenciasController.descargarEvidencia)
  );

  router.patch(
    '/archivar',
    authenticateJWT,
    validarAprendiz,
    asyncHandler(evidenciasController.archivarEvidencia)
  );

  router.patch(
    '/desarchivar',
    authenticateJWT,
    validarAprendiz,
    asyncHandler(evidenciasController.desarchivarEvidencia)
  );

  router.delete(
    '/eliminar/:id_simulacion',
    authenticateJWT,
    validarAprendiz,
    asyncHandler(evidenciasController.eliminarEvidencia)
  );

  return router;
}

module.exports = crearEvidenciasRouter;
