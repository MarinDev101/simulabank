const { body, param, validationResult } = require('express-validator');

// Middlewares reutilizables para validar requests y manejar errores
const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const registerRules = () => [
  body('nombres').isString().isLength({ min: 2 }).withMessage('nombres inválidos'),
  body('apellidos').isString().isLength({ min: 2 }).withMessage('apellidos inválidos'),
  body('correo').isEmail().withMessage('correo inválido'),
  body('contrasena').isLength({ min: 6 }).withMessage('contrasena muy corta'),
  body('rol')
    .optional()
    .isString()
    .custom((value) => {
      const allowed = ['aprendiz', 'aprendices', 'instructor', 'instructores'];
      if (!allowed.includes(value.toString().toLowerCase())) throw new Error('Rol inválido');
      return true;
    }),
];

const loginRules = () => [
  body('correo').isEmail().withMessage('correo inválido'),
  body('contrasena').isLength({ min: 6 }).withMessage('contrasena muy corta'),
];

const refreshRules = () => [body('refreshToken').isString().withMessage('refreshToken requerido')];

const sessionIdParam = () => [param('id').isInt().withMessage('id de sesión inválido')];

module.exports = {
  runValidation,
  registerRules,
  loginRules,
  refreshRules,
  sessionIdParam,
};
