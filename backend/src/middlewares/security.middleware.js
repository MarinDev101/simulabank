const logger = require('../utils/logger');

// Sanitizador simple sin dependencias externas
const sanitizeValue = (val) => {
  if (val == null) return val;
  if (typeof val === 'string') {
    return val
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/`/g, '&#x60;')
      .replace(/\\/g, '&#x5C;')
      .trim();
  }
  if (Array.isArray(val)) return val.map(sanitizeValue);
  if (typeof val === 'object') {
    const out = {};
    for (const k of Object.keys(val)) out[k] = sanitizeValue(val[k]);
    return out;
  }
  return val;
};

// Middleware de sanitización
const securityMiddleware = (req, res, next) => {
  try {
    if (req.body && typeof req.body === 'object') {
      for (const k of Object.keys(req.body)) req.body[k] = sanitizeValue(req.body[k]);
    }
    if (req.query && typeof req.query === 'object') {
      for (const k of Object.keys(req.query)) {
        try {
          req.query[k] = sanitizeValue(req.query[k]);
        } catch {
          logger.debug(`No se pudo sanitizar req.query.${k}`);
        }
      }
    }
    if (req.params && typeof req.params === 'object') {
      for (const k of Object.keys(req.params)) req.params[k] = sanitizeValue(req.params[k]);
    }
  } catch (err) {
    logger.error('Sanitizer error', err);
  }
  next();
};

module.exports = securityMiddleware;
