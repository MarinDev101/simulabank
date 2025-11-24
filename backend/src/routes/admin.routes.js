const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const adminController = require('../controllers/admin.controller');
const { authenticateJWT } = require('../middlewares/jwt.middleware');
const { requireAdmin } = require('../middlewares/admin.middleware');

function crearAdminRouter() {
  const router = express.Router();

  // Rutas protegidas para administradores
  router.get(
    '/aprendices',
    authenticateJWT,
    requireAdmin,
    asyncHandler(adminController.obtenerAprendices)
  );

  router.put(
    '/aprendices/:id',
    authenticateJWT,
    requireAdmin,
    asyncHandler(adminController.actualizarAprendiz)
  );

  router.patch(
    '/aprendices/:id/inhabilitar',
    authenticateJWT,
    requireAdmin,
    asyncHandler(adminController.inhabilitarAprendiz)
  );

  router.patch(
    '/aprendices/:id/habilitar',
    authenticateJWT,
    requireAdmin,
    asyncHandler(adminController.habilitarAprendiz)
  );

  return router;
}

module.exports = crearAdminRouter;
