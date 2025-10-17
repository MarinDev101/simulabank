const requireAdmin = (req, res, next) => {
  const user = req.user;
  if (!user) return res.status(401).json({ success: false, error: 'Usuario no autenticado' });

  const rol = (user.rol || '').toString().toLowerCase();
  if (rol !== 'administrador' && rol !== 'admin') {
    return res
      .status(403)
      .json({ success: false, error: 'Acceso restringido: se requiere rol administrador' });
  }

  next();
};

module.exports = { requireAdmin };
