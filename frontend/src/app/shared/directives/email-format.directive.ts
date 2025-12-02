import { Directive, ElementRef, HostListener } from '@angular/core';

/**
 * Directiva que formatea y limpia la entrada de email en tiempo real.
 *
 * Caracteres permitidos:
 * - Letras: A-Z a-z
 * - Números: 0-9
 * - Símbolos: @ . _ % + -
 *
 * Características:
 * - No permite espacios
 * - Convierte a minúsculas
 * - Bloquea caracteres no válidos al escribir y pegar
 *
 * Uso: <input appEmailFormat />
 */
@Directive({
  selector: '[appEmailFormat]',
  standalone: true,
})
export class EmailFormatDirective {
  // Regex para validar un caracter individual de email
  // Letras, números y símbolos: @ . _ % + -
  private readonly regexCaracterPermitido = /^[A-Za-z0-9@._+%\-]$/;

  // Regex para limpiar (eliminar caracteres no permitidos)
  private readonly regexNoPermitidos = /[^A-Za-z0-9@._+%\-]/g;

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

    // Bloquear espacios
    if (key === ' ') {
      event.preventDefault();
      return;
    }

    // Verificar si es caracter permitido para email
    if (!this.regexCaracterPermitido.test(key)) {
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
    event.preventDefault();

    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const textoPegado = clipboardData.getData('text');
    const textoLimpio = this.limpiarTexto(textoPegado);
    this.insertarTexto(textoLimpio);
  }

  /**
   * Limpia el texto según las reglas de email.
   */
  private limpiarTexto(texto: string): string {
    // Eliminar espacios
    let limpio = texto.replace(/\s/g, '');

    // Solo mantener caracteres permitidos para email
    limpio = limpio.replace(this.regexNoPermitidos, '');

    // Convertir a minúsculas
    limpio = limpio.toLowerCase();

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
