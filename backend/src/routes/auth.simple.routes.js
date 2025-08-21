const express = require('express');
const { body, validationResult } = require('express-validator');
const { registrar, login } = require('../controllers/auth.simple.controller');

const router = express.Router();
const { authenticateJWT } = require('../middlewares/jwt.middleware');

// Registro con validación
router.post(
  '/register',
  [
    body('nombre').isString().isLength({ min: 2 }),
    body('correo').isEmail(),
    body('contraseña').isLength({ min: 6 }),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
  registrar
);

// Login con validación
router.post(
  '/login',
  [body('correo').isEmail(), body('contraseña').isLength({ min: 6 })],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
  login
);

// Refresh token
router.post('/refresh', [body('refreshToken').isString()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { refreshToken } = req.body;
  const tokenService = require('../services/token.service');
  const jwt = require('jsonwebtoken');

  // Verificar existencia en store
  const valid = await tokenService.isRefreshTokenValid(refreshToken);
  if (!valid) return res.status(401).json({ success: false, error: 'Refresh token inválido' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'default_secret');

    // Rotación: revocar refresh token antiguo (one-time use)
    await tokenService.revokeRefreshToken(refreshToken);

    // Emitir nuevos tokens
    const newToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET || 'default_secret', {
      expiresIn: process.env.JWT_EXPIRES || '2h',
    });

    const newRefresh = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET || 'default_secret', {
      expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    });

    // guardar meta del request
    const meta = { ip: req.ip, userAgent: req.get('User-Agent') };
    await tokenService.saveRefreshToken(
      newRefresh,
      decoded.id,
      process.env.JWT_REFRESH_EXPIRES || '7d',
      meta
    );

    res.json({ success: true, token: newToken, refreshToken: newRefresh });
  } catch {
    return res.status(401).json({ success: false, error: 'Refresh token inválido o expirado' });
  }
});

// Logout (revocar refresh)
router.post('/logout', [body('refreshToken').isString()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { refreshToken } = req.body;
  const tokenService = require('../services/token.service');
  await tokenService.revokeRefreshToken(refreshToken);
  res.json({ success: true });
});

// Listar sesiones activas del usuario (protegido)
router.get('/sessions', authenticateJWT, async (req, res) => {
  const tokenService = require('../services/token.service');
  const userId = req.user && req.user.id;
  if (!userId) return res.status(400).json({ success: false, error: 'Usuario no identificado' });

  const sessions = await tokenService.listSessions(userId);
  res.json({ success: true, sessions });
});

// Revocar todas las sesiones del usuario (protegido)
router.post('/logoutAll', authenticateJWT, async (req, res) => {
  const tokenService = require('../services/token.service');
  const userId = req.user && req.user.id;
  if (!userId) return res.status(400).json({ success: false, error: 'Usuario no identificado' });

  await tokenService.revokeAll(userId);
  res.json({ success: true });
});

// Revocar una sesión específica por token (protegido)
router.delete('/sessions/:token', authenticateJWT, async (req, res) => {
  const tokenService = require('../services/token.service');
  const userId = req.user && req.user.id;
  if (!userId) return res.status(400).json({ success: false, error: 'Usuario no identificado' });

  const token = req.params.token;
  if (!token) return res.status(400).json({ success: false, error: 'Token requerido' });

  // Verificar que la sesión pertenece al usuario
  const sessions = await tokenService.listSessions(userId);
  const found = sessions.find((s) => s.token === token);
  if (!found) return res.status(404).json({ success: false, error: 'Sesión no encontrada' });

  await tokenService.revokeRefreshToken(token);
  res.json({ success: true });
});

module.exports = router;
