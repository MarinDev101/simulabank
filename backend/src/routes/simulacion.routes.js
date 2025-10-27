// const express = require('express');
// const { iniciarChat, chatMensaje } = require('../controllers/geminiChat.controller');

// const router = express.Router();

// router.post('/gemini/chat/iniciar', iniciarChat);
// router.post('/gemini/chat/mensaje', chatMensaje);

// module.exports = router;

const express = require('express');
const {
  iniciarSimulacion,
  enviarMensaje,
  obtenerEstado,
  finalizarSimulacion,
} = require('../controllers/simulacion.controller');

module.exports = () => {
  const router = express.Router();

  // Iniciar una nueva simulación
  router.post('/iniciar', iniciarSimulacion);

  // Enviar mensaje del asesor y recibir respuesta del cliente
  router.post('/mensaje', enviarMensaje);

  // Obtener estado actual de la simulación
  router.get('/estado/:userId', obtenerEstado);

  // Finalizar simulación y obtener resumen
  router.post('/finalizar', finalizarSimulacion);

  return router;
};
