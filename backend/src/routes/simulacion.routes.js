const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const simulacionController = require('../controllers/simulacion.controller');

// Middlewares
const { authenticateJWT } = require('../middlewares/jwt.middleware');

// Validadores
const {
  validarIniciarSimulacion
} = require('../validators/simulacion.validator');

/**
 * Función que crea y retorna el router de simulación
 * Todas las rutas están protegidas con autenticación JWT
 */
function crearSimulacionRouter() {
  const router = express.Router();

  /**
   * POST /api/simulacion/iniciar
   * Inicia una nueva simulación de asesoría bancaria
   *
   * Headers: Authorization: Bearer <token>
   * Body: { configuracion: { producto, modo, destino, interaccion } }
   * Response: { ok, cliente, etapaActual, estado, mensajeCliente, mensaje }
   */
  router.post('/iniciar', authenticateJWT, validarIniciarSimulacion, asyncHandler(simulacionController.iniciarSimulacion));

  /**
   * POST /api/simulacion/mensaje
   * Envía un mensaje del asesor y recibe respuesta del cliente IA
   *
   * Headers: Authorization: Bearer <token>
   * Body: { mensaje: "texto del mensaje" }
   * Response: { ok, mensajeCliente, etapaCambiada, etapaActual, estado, ... }
   */
  router.post('/mensaje', authenticateJWT, asyncHandler(simulacionController.enviarMensaje));

  /**
   * GET /api/simulacion/estado
   * Obtiene el estado actual de la simulación
   *
   * Headers: Authorization: Bearer <token>
   * Response: { ok, estado, cliente, etapaActual, historialConversacion, ... }
   */
  router.get('/estado', authenticateJWT, asyncHandler(simulacionController.obtenerEstado));

  /**
   * POST /api/simulacion/finalizar
   * Finaliza la simulación actual y obtiene resumen
   *
   * Headers: Authorization: Bearer <token>
   * Response: { ok, mensaje, duracion, etapasCompletadas, historial, ... }
   */
  router.post(
    '/finalizar',
    authenticateJWT,
    asyncHandler(simulacionController.finalizarSimulacion)
  );

  return router;
}

module.exports = crearSimulacionRouter;
