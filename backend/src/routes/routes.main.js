const express = require('express');
const router = express.Router();

// `auth.routes` exporta una función creadora de routers. Hay que invocarla
// para obtener el Router y pasarlo a `use`. Si se pasa la función sin
// invocarla, Express la ejecuta como middleware y como no llama a `next()`
// ni envía respuesta, la petición queda colgada.
router.use('/auth', require('./auth.routes')());

module.exports = router;
