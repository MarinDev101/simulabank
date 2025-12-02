import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { VALIDATION_REGEX } from '../validators/validation.constants';

/**
 * Directiva que bloquea la entrada de caracteres no numéricos.
 * Útil para campos de teléfono, documentos de identidad, etc.
 *
 * Características:
 * - Solo permite dígitos (0-9)
 * - Opción de limitar cantidad máxima de dígitos
 * - Bloquea caracteres no válidos al escribir y pegar
 *
 * Uso: <input appSoloNumeros [maxDigitos]="10" />
 */
@Directive({
  selector: '[appSoloNumeros]',
  standalone: true,
})
export class SoloNumerosDirective {
  @Input() maxDigitos: number = 0; // 0 = sin límite

  constructor(private el: ElementRef<HTMLInputElement>) {}

  /**
   * Bloquea la escritura de caracteres no numéricos
   */
  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent): void {
    const key = event.key;

    // Permitir teclas de control (Ctrl+C, Ctrl+V, etc.)
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    // Bloquear si NO es un dígito
    if (!/^\d$/.test(key)) {
      event.preventDefault();
      return;
    }

    // Verificar límite de dígitos
    if (this.maxDigitos > 0) {
      const input = this.el.nativeElement;
      const currentLength = input.value.replace(/[^\d]/g, '').length;
      const selectionLength = Math.abs((input.selectionEnd || 0) - (input.selectionStart || 0));

      if (currentLength - selectionLength >= this.maxDigitos) {
        event.preventDefault();
      }
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
   * Bloquea el pegado de texto con caracteres no numéricos
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
   * Limpia el texto dejando solo dígitos
   */
  private limpiarTexto(texto: string): string {
    let limpio = texto.replace(VALIDATION_REGEX.noNumeros, '');

    // Aplicar límite de dígitos si está configurado
    if (this.maxDigitos > 0 && limpio.length > this.maxDigitos) {
      limpio = limpio.substring(0, this.maxDigitos);
    }

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
