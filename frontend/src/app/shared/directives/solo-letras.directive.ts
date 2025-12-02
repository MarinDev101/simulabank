import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { VALIDATION_REGEX } from '../validators/validation.constants';

/**
 * Directiva que bloquea la entrada de caracteres no permitidos en campos de nombre/apellido.
 *
 * Caracteres permitidos (estándar):
 * - Letras: A-Z a-z
 * - Acentos: Á É Í Ó Ú á é í ó ú
 * - Ñ ñ
 * - Diéresis: Ü ü
 * - Apóstrofe: ' (para nombres como O'Connor)
 * - Guión: - (para nombres compuestos como María-José)
 * - Espacio simple entre palabras
 *
 * Características:
 * - Bloquea escritura de caracteres no válidos
 * - Bloquea pegado de caracteres no válidos
 * - Limpia automáticamente al escribir o pegar
 * - No permite espacios, guiones o apóstrofes al inicio
 * - No permite dobles espacios, guiones o apóstrofes
 *
 * Uso: <input appSoloLetras />
 */
@Directive({
  selector: '[appSoloLetras]',
  standalone: true,
})
export class SoloLetrasDirective {
  @Input() permitirEspacios = true;

  constructor(private el: ElementRef<HTMLInputElement>) {}

  /**
   * Bloquea la escritura de caracteres no válidos
   */
  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent): void {
    const key = event.key;

    // Permitir teclas de control (Ctrl+C, Ctrl+V, etc.)
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const input = this.el.nativeElement;
    const value = input.value;
    const selectionStart = input.selectionStart || 0;

    // Verificar si es espacio
    if (key === ' ') {
      if (!this.permitirEspacios) {
        event.preventDefault();
        return;
      }
      // No permitir espacio al inicio
      if (selectionStart === 0 || value.length === 0) {
        event.preventDefault();
        return;
      }
      // No permitir espacios dobles o después de guión/apóstrofe
      const charAnterior = value[selectionStart - 1];
      if (charAnterior === ' ' || charAnterior === '-' || charAnterior === "'") {
        event.preventDefault();
        return;
      }
      return;
    }

    // Verificar guión
    if (key === '-') {
      // No permitir al inicio
      if (selectionStart === 0 || value.length === 0) {
        event.preventDefault();
        return;
      }
      // No permitir dobles o después de espacio/apóstrofe
      const charAnterior = value[selectionStart - 1];
      if (charAnterior === '-' || charAnterior === ' ' || charAnterior === "'") {
        event.preventDefault();
        return;
      }
      return;
    }

    // Verificar apóstrofe
    if (key === "'") {
      // No permitir al inicio
      if (selectionStart === 0 || value.length === 0) {
        event.preventDefault();
        return;
      }
      // No permitir dobles o después de espacio/guión
      const charAnterior = value[selectionStart - 1];
      if (charAnterior === "'" || charAnterior === ' ' || charAnterior === '-') {
        event.preventDefault();
        return;
      }
      return;
    }

    // Bloquear si NO es una letra válida
    if (!VALIDATION_REGEX.caracterNombrePermitido.test(key)) {
      event.preventDefault();
    }
  }

  /**
   * Limpia el campo después de cualquier entrada
   */
  @HostListener('input')
  onInput(): void {
    this.limpiarCampo();
  }

  /**
   * Bloquea el pegado de texto con caracteres no permitidos
   */
  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    // Prevenir el pegado por defecto
    event.preventDefault();

    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const textoPegado = clipboardData.getData('text');

    // Verificar si contiene caracteres no permitidos
    if (VALIDATION_REGEX.noLetras.test(textoPegado)) {
      // Limpiar el texto pegado
      const textoLimpio = this.limpiarTexto(textoPegado);
      this.insertarTexto(textoLimpio);
    } else {
      // El texto está limpio, insertarlo directamente
      this.insertarTexto(this.limpiarTexto(textoPegado));
    }
  }

  /**
   * Limpia espacios al final al perder el foco
   */
  @HostListener('blur')
  onBlur(): void {
    const input = this.el.nativeElement;
    const valorLimpio = input.value.trimEnd();
    if (input.value !== valorLimpio) {
      input.value = valorLimpio;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  /**
   * Limpia el texto según las reglas de nombre
   */
  private limpiarTexto(texto: string): string {
    let limpio = texto
      .replace(VALIDATION_REGEX.noLetras, '') // Solo letras, espacios, guión y apóstrofe
      .trimStart() // Sin espacios al inicio
      .replace(VALIDATION_REGEX.espaciosMultiples, ' ') // Un solo espacio entre palabras
      .replace(VALIDATION_REGEX.multipleGuion, '-') // Un solo guión
      .replace(VALIDATION_REGEX.multipleApostrofe, "'"); // Un solo apóstrofe

    // Eliminar guión o apóstrofe al inicio
    limpio = limpio.replace(/^[\-']+/, '');

    // Eliminar secuencias inválidas como "- " o "' " o " -" o " '"
    limpio = limpio.replace(/[\-']\s|\s[\-']/g, ' ').replace(VALIDATION_REGEX.espaciosMultiples, ' ');

    return limpio;
  }

  /**
   * Limpia el campo de entrada
   */
  private limpiarCampo(): void {
    const input = this.el.nativeElement;
    const valorOriginal = input.value;
    const valorLimpio = this.limpiarTexto(valorOriginal);

    if (valorOriginal !== valorLimpio) {
      const cursorPos = input.selectionStart || 0;
      const diff = valorOriginal.length - valorLimpio.length;
      input.value = valorLimpio;

      // Ajustar posición del cursor
      const newPos = Math.max(0, cursorPos - diff);
      input.setSelectionRange(newPos, newPos);
    }
  }

  /**
   * Inserta texto limpio en la posición del cursor
   */
  private insertarTexto(texto: string): void {
    const input = this.el.nativeElement;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const valorActual = input.value;

    // Construir nuevo valor
    let nuevoValor = valorActual.substring(0, start) + texto + valorActual.substring(end);
    nuevoValor = this.limpiarTexto(nuevoValor);

    input.value = nuevoValor;

    // Posicionar cursor
    const newPosition = Math.min(start + texto.length, nuevoValor.length);
    input.setSelectionRange(newPosition, newPosition);

    // Notificar a Angular del cambio
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
