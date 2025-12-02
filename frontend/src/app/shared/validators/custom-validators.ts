import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';
import { VALIDATION_REGEX, VALIDATION_CONFIG } from './validation.constants';

// ========================================
// VALIDADORES PERSONALIZADOS PARA ANGULAR
// ========================================

/**
 * Validador para verificar que cada palabra tenga un mínimo de caracteres
 * @param minLetras Número mínimo de letras por palabra (default: 2)
 */
export function palabrasMinimasValidator(minLetras: number = 2): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value?.trim();
    if (!valor) return null; // Dejar que el validador required maneje campos vacíos

    const palabras = valor.split(/\s+/);
    const todasValidas = palabras.every((palabra: string) => palabra.length >= minLetras);

    return todasValidas ? null : { palabrasMinimas: { requiredLength: minLetras } };
  };
}

/**
 * Validador para nombres (solo letras, sin caracteres especiales)
 */
export function nombreValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value?.trim();
    if (!valor) return null;

    // Verificar que solo contenga letras y espacios
    if (!VALIDATION_REGEX.soloLetras.test(valor)) {
      return { pattern: true };
    }

    return null;
  };
}

/**
 * Validador para email robusto
 */
export function emailRobustoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value?.trim().toLowerCase();
    if (!valor) return null;

    // Verificar formato de email robusto
    if (!VALIDATION_REGEX.email.test(valor)) {
      return { email: true };
    }

    return null;
  };
}

/**
 * Validador para contraseña fuerte
 * Requiere: mayúscula, minúscula, número y símbolo especial
 */
export function passwordFuerteValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    if (!valor) return null;

    const errores: ValidationErrors = {};

    if (!/[a-z]/.test(valor)) {
      errores['minuscula'] = true;
    }
    if (!/[A-Z]/.test(valor)) {
      errores['mayuscula'] = true;
    }
    if (!/\d/.test(valor)) {
      errores['numero'] = true;
    }
    if (!/[@$!%*?&]/.test(valor)) {
      errores['simbolo'] = true;
    }

    return Object.keys(errores).length > 0 ? { passwordStrength: errores } : null;
  };
}

/**
 * Validador para teléfono móvil colombiano
 * Debe iniciar con 3 y tener exactamente 10 dígitos
 */
export function telefonoColombiaValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value?.replace(/[^\d]/g, '');
    if (!valor) return null;

    if (!VALIDATION_REGEX.soloNumeros10.test(valor)) {
      return { pattern: true };
    }

    if (!VALIDATION_REGEX.telefonoMovilColombia.test(valor)) {
      return { telefonoMovil: true };
    }

    return null;
  };
}

/**
 * Validador para confirmar que dos contraseñas coincidan
 * Se usa a nivel de FormGroup
 */
export function confirmarContrasenaValidator(
  passwordField: string = 'contrasena',
  confirmField: string = 'confirmarContrasena'
): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const form = formGroup as FormGroup;
    const password = form.get(passwordField)?.value;
    const confirmPassword = form.get(confirmField)?.value;

    if (!password || !confirmPassword) return null;

    return password === confirmPassword ? null : { noCoinciden: true };
  };
}

/**
 * Validador que no permite espacios
 */
export function sinEspaciosValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    if (!valor) return null;

    if (/\s/.test(valor)) {
      return { sinEspacios: true };
    }

    return null;
  };
}

/**
 * Validador que no permite caracteres especiales (solo alfanuméricos)
 */
export function soloAlfanumericoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    if (!valor) return null;

    if (!/^[A-Za-z0-9]+$/.test(valor)) {
      return { soloAlfanumerico: true };
    }

    return null;
  };
}

/**
 * Validador que limpia y normaliza el valor automáticamente
 * Elimina espacios múltiples y trim
 */
export function normalizarTextoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    if (!valor || typeof valor !== 'string') return null;

    // Normalizar el valor
    const normalizado = valor
      .replace(VALIDATION_REGEX.espaciosMultiples, ' ')
      .trim();

    // Si el valor cambió, actualizar el control
    if (normalizado !== valor) {
      control.setValue(normalizado, { emitEvent: false });
    }

    return null;
  };
}

// ========================================
// FUNCIONES UTILITARIAS DE VALIDACIÓN
// ========================================

/**
 * Verifica los indicadores de fortaleza de contraseña
 */
export function verificarIndicadoresPassword(valor: string): {
  longitud: boolean;
  numero: boolean;
  mayuscula: boolean;
  minuscula: boolean;
  simbolo: boolean;
} {
  return {
    longitud: valor.length >= VALIDATION_CONFIG.password.minLength,
    numero: /\d/.test(valor),
    mayuscula: /[A-Z]/.test(valor),
    minuscula: /[a-z]/.test(valor),
    simbolo: /[@$!%*?&]/.test(valor),
  };
}

/**
 * Verifica si cada palabra tiene el mínimo de caracteres
 */
export function validarPalabrasMinimas(texto: string, minLetras: number = 2): boolean {
  if (!texto) return false;
  const palabras = texto.trim().split(/\s+/);
  return palabras.every(palabra => palabra.length >= minLetras);
}

/**
 * Limpia texto eliminando caracteres no permitidos para nombres
 */
export function limpiarTextoNombre(texto: string): string {
  if (!texto) return '';
  return texto
    .replace(VALIDATION_REGEX.noLetras, '')
    .replace(VALIDATION_REGEX.espaciosMultiples, ' ')
    .trimStart();
}

/**
 * Limpia texto para email (sin espacios, lowercase)
 */
export function limpiarTextoEmail(texto: string): string {
  if (!texto) return '';
  return texto
    .replace(/\s/g, '')
    .replace(VALIDATION_REGEX.multipleArroba, '@')
    .replace(VALIDATION_REGEX.multiplePunto, '.')
    .toLowerCase();
}

/**
 * Limpia texto para teléfono (solo dígitos)
 */
export function limpiarTextoTelefono(texto: string): string {
  if (!texto) return '';
  return texto.replace(VALIDATION_REGEX.noNumeros, '');
}

/**
 * Limpia texto para contraseña (sin espacios, sin caracteres no ASCII)
 */
export function limpiarTextoPassword(texto: string): string {
  if (!texto) return '';
  return texto
    .replace(/\s/g, '')
    .replace(VALIDATION_REGEX.caracteresASCII, '');
}
