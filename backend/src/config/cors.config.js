const { cors } = require('./env.config');
const logger = require('../utils/logger');

const allowedOrigins = cors.origins || ['*'];

const corsOptions = allowedOrigins.includes('*')
  ? { origin: '*' }
  : {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        try {
          logger.warn(`CORS: origen rechazado -> ${origin}`);
        } catch (err) {
          void err;
        }
        callback(new Error(`CORS policy: Origin '${origin}' not allowed`));
      },
    };

module.exports = { corsOptions };
