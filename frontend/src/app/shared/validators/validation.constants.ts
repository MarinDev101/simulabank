// ========================================
// CONSTANTES DE VALIDACIÓN
// ========================================

/**
 * Configuración global de validaciones
 */
export const VALIDATION_CONFIG = {
  debounceDelay: 300,
  nombre: {
    minLength: 2,
    maxLength: 50,
    minPalabraLength: 2,
  },
  apellido: {
    minLength: 2,
    maxLength: 50,
    minPalabraLength: 2,
  },
  email: {
    maxLength: 100,
  },
  password: {
    minLength: 8,
    maxLength: 50,
  },
  telefono: {
    exactLength: 10,
    prefijoMovilColombia: '3',
  },
};

// ========================================
// EXPRESIONES REGULARES
// ========================================

/**
 * ESTÁNDARES DE VALIDACIÓN:
 *
 * 1. NOMBRE/APELLIDO - Caracteres permitidos:
 *    A-Z a-z ÁÉÍÓÚáéíóú Ññ Üü ' - (espacio)
 *    - Letras mayúsculas y minúsculas
 *    - Acentos: á é í ó ú Á É Í Ó Ú
 *    - Ñ ñ
 *    - Diéresis: ü Ü
 *    - Apóstrofe: ' (para nombres como O'Connor)
 *    - Guión: - (para nombres compuestos como María-José)
 *    - Espacio simple entre palabras
 *
 * 2. EMAIL - Estándar RFC 5322 simplificado:
 *    Antes del @: a-z A-Z 0-9 . _ % + -
 *    Después del @: a-z A-Z 0-9 . -
 *    - Un solo @
 *    - Al menos un punto después del @
 *    - Sin espacios, comas, tildes ni emojis
 *
 * 3. CONTRASEÑA - Máxima flexibilidad:
 *    Letras, números y símbolos:
 *    ! @ # $ % ^ & * ( ) _ + - = { } [ ] : ; " ' < > , . ? / \ | ` ~
 */

export const VALIDATION_REGEX = {
  // ========================================
  // NOMBRE Y APELLIDO
  // ========================================

  /**
   * Validación completa de nombre/apellido.
   * Permite: A-Z a-z ÁÉÍÓÚáéíóú Ññ Üü ' - (espacio entre palabras)
   * No permite espacios al inicio/final ni dobles espacios.
   */
  soloLetras: /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü'-]+(?:\s[A-Za-zÁÉÍÓÚáéíóúÑñÜü'-]+)*$/,

  /**
   * Patrón para validar solo letras en inputs (permite espacios entre palabras)
   */
  soloLetrasInput: /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü'\-\s]+$/,

  /**
   * Caracter individual permitido en campos de nombre/apellido
   * Incluye: letras, acentos, ñ, ü, apóstrofe y guión
   */
  caracterNombrePermitido: /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü'\-]$/,

  /**
   * Caracteres permitidos en campos de nombre/apellido (para validar tecla)
   */
  caracteresNombrePermitidos: /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü'\-\s]$/,

  /**
   * Caracteres NO permitidos en nombres (para limpiar)
   * Elimina todo excepto: letras, acentos, ñ, ü, apóstrofe, guión y espacio
   */
  noLetras: /[^A-Za-zÁÉÍÓÚáéíóúÑñÜü'\-\s]/g,

  // ========================================
  // EMAIL
  // ========================================

  /**
   * Email robusto:
   * - Antes del @: [a-zA-Z0-9._%+-]
   * - Después del @: [a-zA-Z0-9.-]
   * - Un solo @, al menos un punto después del @
   */
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  /**
   * Caracter individual permitido en campos de email
   * Antes del @: a-z A-Z 0-9 . _ % + -
   * Después del @: a-z A-Z 0-9 . -
   * Incluye @ para permitir escribirlo
   */
  caracterEmailPermitido: /^[a-zA-Z0-9@._%+\-]$/,

  /**
   * Caracteres permitidos en campos de email (para validar tecla)
   */
  caracteresEmailPermitidos: /^[a-zA-Z0-9@._%+\-]$/,

  /**
   * Caracteres NO permitidos en email (para limpiar)
   * Elimina todo excepto: a-zA-Z0-9 @ . _ % + -
   */
  caracteresEmailNoPermitidos: /[^a-zA-Z0-9@._%+\-]/g,

  // ========================================
  // CONTRASEÑA
  // ========================================

  /**
   * Password fuerte: mínimo 8 caracteres, al menos una mayúscula,
   * una minúscula, un número y un símbolo especial.
   */
  passwordFuerte: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]{8,}$/,

  /**
   * Password básico: al menos una letra y un número
   */
  passwordBasico: /^(?=.*[A-Za-z])(?=.*\d).{6,20}$/,

  /**
   * Caracter individual permitido en contraseñas
   * Incluye: letras, números y símbolos comunes
   * ! @ # $ % ^ & * ( ) _ + - = { } [ ] : ; " ' < > , . ? / \ | ` ~
   */
  caracterPasswordPermitido: /^[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]$/,

  /**
   * Caracteres permitidos en contraseñas (para validar tecla)
   */
  caracteresPasswordPermitidos: /^[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]$/,

  /**
   * Caracteres NO permitidos en password (para limpiar)
   * Elimina todo excepto: letras, números y símbolos permitidos
   */
  caracteresPasswordNoPermitidos: /[^A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/g,

  // ========================================
  // TELÉFONO
  // ========================================

  /**
   * Solo números, exactamente 10 dígitos (útil para teléfono colombiano)
   */
  soloNumeros10: /^\d{10}$/,

  /**
   * Solo dígitos
   */
  soloDigitos: /^\d+$/,

  /**
   * Teléfono móvil colombiano: inicia con 3 y tiene 10 dígitos.
   */
  telefonoMovilColombia: /^3\d{9}$/,

  /**
   * Caracteres no numéricos (para limpiar)
   */
  noNumeros: /[^\d]/g,

  // ========================================
  // UTILIDADES GENERALES
  // ========================================

  /**
   * Caracteres NO permitidos en entradas generales
   */
  caracteresNoPermitidos: /[^A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\s@._%+\-']/g,

  /**
   * Solo caracteres ASCII imprimibles (espacio a ~)
   */
  caracteresASCII: /[^\x20-\x7E]/g,

  /**
   * Espacios múltiples
   */
  espaciosMultiples: /\s{2,}/g,

  /**
   * Más de un arroba
   */
  multipleArroba: /@{2,}/g,

  /**
   * Más de un punto seguido
   */
  multiplePunto: /\.{2,}/g,

  /**
   * Múltiples guiones seguidos
   */
  multipleGuion: /-{2,}/g,

  /**
   * Múltiples apóstrofes seguidos
   */
  multipleApostrofe: /'{2,}/g,
};

// ========================================
// MENSAJES DE ERROR
// ========================================

export const VALIDATION_MESSAGES = {
  nombre: {
    required: 'El nombre es obligatorio.',
    minlength: `El nombre debe tener al menos ${VALIDATION_CONFIG.nombre.minLength} caracteres.`,
    maxlength: `El nombre no puede exceder ${VALIDATION_CONFIG.nombre.maxLength} caracteres.`,
    pattern: 'El nombre solo puede contener letras.',
    palabrasMinimas: 'Cada palabra del nombre debe tener al menos 2 letras.',
  },
  apellido: {
    required: 'El apellido es obligatorio.',
    minlength: `El apellido debe tener al menos ${VALIDATION_CONFIG.apellido.minLength} caracteres.`,
    maxlength: `El apellido no puede exceder ${VALIDATION_CONFIG.apellido.maxLength} caracteres.`,
    pattern: 'El apellido solo puede contener letras.',
    palabrasMinimas: 'Cada palabra del apellido debe tener al menos 2 letras.',
  },
  correo: {
    required: 'El correo electrónico es obligatorio.',
    email: 'Ingresa un correo electrónico válido.',
    pattern: 'El formato del correo no es válido.',
    maxlength: `El correo no puede exceder ${VALIDATION_CONFIG.email.maxLength} caracteres.`,
  },
  contrasena: {
    required: 'La contraseña es obligatoria.',
    minlength: `La contraseña debe tener al menos ${VALIDATION_CONFIG.password.minLength} caracteres.`,
    maxlength: `La contraseña no puede exceder ${VALIDATION_CONFIG.password.maxLength} caracteres.`,
    pattern: 'Faltan requerimientos para la contraseña.',
    passwordStrength: 'La contraseña debe incluir mayúsculas, minúsculas, números y símbolos.',
  },
  confirmarContrasena: {
    required: 'Debes confirmar la contraseña.',
    noCoinciden: 'Las contraseñas no coinciden.',
  },
  telefono: {
    required: 'El teléfono es obligatorio.',
    pattern: 'El teléfono debe tener exactamente 10 dígitos.',
    telefonoMovil: 'El número debe iniciar con 3 (números móviles en Colombia).',
  },
  terminos: {
    required: 'Debes aceptar los términos y condiciones.',
  },
  recaptcha: {
    required: 'Por favor, completa el captcha.',
  },
  general: {
    caracteresNoPermitidos: 'Se han bloqueado caracteres no permitidos.',
    camposIncompletos: 'Por favor, completa todos los campos requeridos.',
  },
};
