const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const estadisticasController = require('../controllers/estadisticas.controller');

// Middlewares
const { authenticateJWT } = require('../middlewares/jwt.middleware');

// Validadores
const { validarAprendiz } = require('../validators/user.validator');

function crearEstadisticasRouter() {
  const router = express.Router();

  router.get('/listarLogros', asyncHandler(estadisticasController.listarLogros));

  router.get(
    '/listarLogrosAprendiz',
    authenticateJWT,
    validarAprendiz,
    asyncHandler(estadisticasController.listarLogrosAprendiz)
  );

  router.get(
    '/listarInformacionInicio',
    authenticateJWT,
    validarAprendiz,
    asyncHandler(estadisticasController.listarInformacionInicio)
  );

  return router;
}

module.exports = crearEstadisticasRouter;
