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
    '/ver',
    authenticateJWT,
    validarAprendiz,
    asyncHandler(evidenciasController.verEvidencia)
  );

  router.get(
    '/descargar',
    authenticateJWT,
    validarAprendiz,
    asyncHandler(evidenciasController.descargarEvidencia)
  );

  router.post(
    '/archivar',
    authenticateJWT,
    validarAprendiz,
    asyncHandler(evidenciasController.archivarEvidencia)
  );

  router.post(
    '/desarchivar',
    authenticateJWT,
    validarAprendiz,
    asyncHandler(evidenciasController.desarchivarEvidencia)
  );

  router.post(
    '/eliminar',
    authenticateJWT,
    validarAprendiz,
    asyncHandler(evidenciasController.eliminarEvidencia)
  );

  return router;
}

module.exports = crearEvidenciasRouter;
