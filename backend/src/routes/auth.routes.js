const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authController = require('../controllers/auth.controller');
const { upload } = require('../config/multer.config');

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
  router.post(
    '/registrar-inicio',
    registerRules(), // Puedes usar las mismas validaciones
    runValidation,
    asyncHandler(authController.iniciarRegistro.bind(authController))
  );

  router.post(
    '/verificar-codigo',
    asyncHandler(authController.verificarCodigoRegistro.bind(authController))
  );

  // Rutas protegidas
  router.get(
    '/sessions',
    authenticateJWT,
    asyncHandler(authController.listSessions.bind(authController))
  );
  // Acepta multipart/form-data con campo 'foto' (opcional). Si no envías archivo,
  // sigue aceptando los campos por JSON en el cuerpo (p. ej. foto_perfil como cadena).
  router.put(
    '/perfil-inicial',
    authenticateJWT,
    upload.single('foto'),
    asyncHandler(authController.actualizarPerfilInicial.bind(authController))
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
