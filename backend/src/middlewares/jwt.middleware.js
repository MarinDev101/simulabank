const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env.config');

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Token no proporcionado' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  jwt.verify(token, jwtConfig.secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, error: 'Token inválido' });
    }

    req.user = decoded;
    next();
  });
};

module.exports = { authenticateJWT };
