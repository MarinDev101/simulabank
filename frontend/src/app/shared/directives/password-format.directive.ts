import { Directive, ElementRef, HostListener } from '@angular/core';

/**
 * Directiva que formatea y limpia la entrada de contraseña en tiempo real.
 *
 * Caracteres permitidos (estándar moderno - máxima flexibilidad):
 * - Letras: A-Z a-z Ñ ñ
 * - Números: 0-9
 * - Símbolos: ! @ # $ % ^ & * ( ) _ + - = { } [ ] : ; " ' < > , . ? / \ | ` ~
 *
 * Características:
 * - No permite espacios
 * - Solo permite caracteres ASCII imprimibles + ñ
 * - Bloquea caracteres no válidos al escribir y pegar
 *
 * Uso: <input appPasswordFormat />
 */
@Directive({
  selector: '[appPasswordFormat]',
  standalone: true,
})
export class PasswordFormatDirective {
  // Regex para validar un caracter individual de contraseña
  // Letras (incluyendo ñ), números y símbolos: !@#$%^&*()_+-={}[]:;"'<>,.?/\|`~
  private readonly regexCaracterPermitido = /^[A-Za-zÑñ0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]$/;

  // Regex para limpiar (eliminar caracteres no permitidos)
  private readonly regexNoPermitidos = /[^A-Za-zÑñ0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/g;

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

    // Verificar si es caracter permitido para contraseña
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
   * Limpia el texto según las reglas de contraseña.
   *
   * Caracteres permitidos (mismo set que keypress):
   * A-Za-z 0-9 ! @ # $ % ^ & * ( ) _ + - = { } [ ] : ; " ' < > , . ? / \ | ` ~
   *
   * NO permite: espacios
   */
  private limpiarTexto(texto: string): string {
    // Eliminar espacios
    let limpio = texto.replace(/\s/g, '');

    // Solo mantener caracteres permitidos para contraseña
    limpio = limpio.replace(this.regexNoPermitidos, '');

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
