const { pool } = require('../config/database.config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const tokenService = require('../services/token.service');

// Registrar usuario (ejemplo simple)
const registrar = asyncHandler(async (req, res) => {
  const { nombre, correo, contraseña } = req.body;

  // Verificar existente
  const [exist] = await pool.query('SELECT id_usuario FROM usuarios WHERE correo = ?', [correo]);
  if (exist.length > 0) {
    return res.status(400).json({ success: false, error: 'Correo ya registrado' });
  }

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(contraseña, salt);

  const nuevo = {
    nombre,
    correo,
    contraseña: hashed,
    fecha_registro: new Date(),
  };

  const [result] = await pool.query('INSERT INTO usuarios SET ?', [nuevo]);

  res.status(201).json({ success: true, id: result.insertId });
});

// Login simple
const login = asyncHandler(async (req, res) => {
  const { correo, contraseña } = req.body;

  const [rows] = await pool.query(
    'SELECT id_usuario, contraseña, correo, rol FROM usuarios WHERE correo = ?',
    [correo]
  );
  if (rows.length === 0)
    return res.status(400).json({ success: false, error: 'Credenciales inválidas' });

  const user = rows[0];
  const match = await bcrypt.compare(contraseña, user.contraseña);
  if (!match) return res.status(400).json({ success: false, error: 'Credenciales inválidas' });

  const payload = { id: user.id_usuario, correo: user.correo, rol: user.rol };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'default_secret', {
    expiresIn: process.env.JWT_EXPIRES || '2h',
  });

  // Crear refresh token (más duradero)
  const refreshToken = jwt.sign(
    { id: user.id_usuario },
    process.env.JWT_SECRET || 'default_secret',
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    }
  );

  // Guardar refresh token (memoria o Redis) asociado a userId con meta (IP, userAgent)
  const meta = { ip: req.ip, userAgent: req.get('User-Agent') };
  await tokenService.saveRefreshToken(
    refreshToken,
    user.id_usuario,
    process.env.JWT_REFRESH_EXPIRES || '7d',
    meta
  );

  res.json({ success: true, token, refreshToken });
});

module.exports = { registrar, login };
