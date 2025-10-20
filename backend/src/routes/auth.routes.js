const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authController = require('../controllers/auth.controller');

// Middlewares
const { authenticateJWT } = require('../middlewares/jwt.middleware');
const { requireAdmin } = require('../middlewares/admin.middleware');

// Validadores
const {
  runValidation,
  registerRules,
  loginRules,
  refreshRules,
  sessionIdParam,
} = require('../validators/auth.validator');

function crearAuthRouter() {
  const router = express.Router();

  // Rutas públicas
  // Bind controller methods so `this` dentro del controlador apunte al objeto
  // exportado y no falle al acceder a métodos auxiliares como _normalizarRol
  router.post(
    '/register',
    registerRules(),
    runValidation,
    asyncHandler(authController.registrar.bind(authController))
  );
  router.post(
    '/login',
    loginRules(),
    runValidation,
    asyncHandler(authController.login.bind(authController))
  );
  router.post(
    '/refresh',
    refreshRules(),
    runValidation,
    asyncHandler(authController.refresh.bind(authController))
  );
  router.post(
    '/logout',
    refreshRules(),
    runValidation,
    asyncHandler(authController.logout.bind(authController))
  );

  // Rutas protegidas
  router.get(
    '/sessions',
    authenticateJWT,
    asyncHandler(authController.listSessions.bind(authController))
  );
  router.post(
    '/logoutAll',
    authenticateJWT,
    asyncHandler(authController.logoutAll.bind(authController))
  );
  router.delete(
    '/sessions/:id',
    authenticateJWT,
    sessionIdParam(),
    runValidation,
    asyncHandler(authController.revokeSession.bind(authController))
  );

  // Admin
  router.get(
    '/admin',
    authenticateJWT,
    requireAdmin,
    asyncHandler(authController.adminEndpoint.bind(authController))
  );

  return router;
}

module.exports = crearAuthRouter;
