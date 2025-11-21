const { body, param, validationResult } = require('express-validator');

// Middlewares reutilizables para validar requests y manejar errores
const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('[VALIDATOR ERROR]', errors.array());
    return res.status(400).json({
      success: false,
      error: errors
        .array()
        .map((e) => e.msg)
        .join(', '),
      errors: errors.array(),
    });
  }
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

const registerAdminRules = () => [
  body('nombres').isString().isLength({ min: 2 }).withMessage('nombres inválidos'),
  body('apellidos').isString().isLength({ min: 2 }).withMessage('apellidos inválidos'),
  body('correo').isEmail().withMessage('correo inválido'),
  body('contrasena')
    .isLength({ min: 8 })
    .withMessage('contraseña debe tener al menos 8 caracteres'),
];

const loginRules = () => [
  body('correo').isEmail().withMessage('correo inválido'),
  body('contrasena').isLength({ min: 6 }).withMessage('contrasena muy corta'),
];

const refreshRules = () => [body('refreshToken').isString().withMessage('refreshToken requerido')];

const sessionIdParam = () => [param('id').isInt().withMessage('id de sesión inválido')];

const recuperacionRules = () => [body('correo').isEmail().withMessage('correo inválido')];

const verificarCodigoRecuperacionRules = () => [
  body('correo').trim().isEmail().withMessage('correo inválido'),
  body('codigo')
    .trim()
    .notEmpty()
    .withMessage('código requerido')
    .isLength({ min: 6, max: 6 })
    .withMessage('código debe tener exactamente 6 dígitos')
    .matches(/^\d+$/)
    .withMessage('código solo debe contener dígitos'),
];

const restablecerContrasenaRules = () => [
  body('token_temporal').isString().withMessage('token_temporal requerido'),
  body('nueva_contrasena')
    .isLength({ min: 8 })
    .withMessage('contraseña debe tener al menos 8 caracteres'),
];

module.exports = {
  runValidation,
  registerRules,
  registerAdminRules,
  loginRules,
  refreshRules,
  sessionIdParam,
  recuperacionRules,
  verificarCodigoRecuperacionRules,
  restablecerContrasenaRules,
};
