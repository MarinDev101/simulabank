import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  Output,
  EventEmitter,
  Input,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RecuperacionService } from '@app/core/auth/service/recuperacion';

@Component({
  selector: 'app-validacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './validacion.html',
})
export class Validacion implements OnInit {
  @Input() correoUsuario: string = '';
  @Output() volver = new EventEmitter<void>();
  @Output() continuar = new EventEmitter<string>(); // Emitimos el token temporal

  pinForm!: FormGroup;
  pinControls = Array(6);
  isLoading = false;
  errorMessage = '';
  isResending = false;
  resendMessage = '';
  tokenTemporal = '';

  @ViewChild('inputsContainer') inputsContainer!: ElementRef<HTMLDivElement>;

  constructor(
    private fb: FormBuilder,
    private recuperacionService: RecuperacionService
  ) {}

  ngOnInit() {
    const group: any = {};
    for (let i = 0; i < 6; i++) {
      group[`digit${i}`] = ['', [Validators.pattern('[0-9]')]];
    }
    this.pinForm = this.fb.group(group);
  }

  onInput(event: any, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (!/^[0-9]$/.test(value)) {
      input.value = '';
      this.pinForm.get(`digit${index}`)?.setValue('');
      return;
    }

    if (value && index < 5) {
      const next = this.inputsContainer.nativeElement.children[index + 1] as HTMLInputElement;
      next?.focus();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace') {
      if (input.value) {
        event.preventDefault();
        input.value = '';
        this.pinForm.get(`digit${index}`)?.setValue('');
      } else if (!input.value && index > 0) {
        event.preventDefault();
        const prev = this.inputsContainer.nativeElement.children[index - 1] as HTMLInputElement;
        prev?.focus();
        prev.value = '';
        this.pinForm.get(`digit${index - 1}`)?.setValue('');
      }
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      const prev = this.inputsContainer.nativeElement.children[index - 1] as HTMLInputElement;
      prev?.focus();
    }

    if (event.key === 'ArrowRight' && index < 5) {
      const next = this.inputsContainer.nativeElement.children[index + 1] as HTMLInputElement;
      next?.focus();
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasteData = event.clipboardData?.getData('text') || '';
    const digits = pasteData.replace(/\D/g, '').slice(0, 6).split('');

    const inputs = this.inputsContainer.nativeElement.querySelectorAll('input');
    digits.forEach((d, i) => {
      if (i < 6) {
        this.pinForm.get(`digit${i}`)?.setValue(d);
        (inputs[i] as HTMLInputElement).value = d;
      }
    });

    const lastFilledIndex = Math.min(digits.length, 6) - 1;
    if (lastFilledIndex >= 0) {
      (inputs[lastFilledIndex] as HTMLInputElement)?.focus();
    }
  }

  verificarCodigo() {
    const codigo = Object.values(this.pinForm.value)
      .map((v) => String(v || '').trim())
      .join('');

    console.log('Código construido:', codigo, 'Largo:', codigo.length);

    if (codigo.length !== 6) {
      this.errorMessage = 'Por favor, ingresa el código completo de 6 dígitos';
      return;
    }

    if (!/^\d+$/.test(codigo)) {
      this.errorMessage = 'El código solo debe contener dígitos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    console.log('Enviando solicitud:', { correo: this.correoUsuario, codigo });

    this.recuperacionService
      .verificarCodigoRecuperacion({ correo: this.correoUsuario, codigo })
      .subscribe({
        next: (response: any) => {
          console.log('Verificación exitosa:', response);
          this.tokenTemporal = response.token_temporal;

          // Guardar token temporal en localStorage para usarlo en el siguiente paso
          localStorage.setItem('token_recuperacion', this.tokenTemporal);

          setTimeout(() => {
            this.isLoading = false;
            this.continuar.emit(this.tokenTemporal);
          }, 1000);
        },
        error: (error: any) => {
          this.isLoading = false;
          console.error('Error al verificar código:', error);
          console.error('Respuesta de error:', error.error);

          if (error.status === 400) {
            this.errorMessage = error.error?.error || 'Código inválido o expirado';
          } else if (error.status === 0) {
            this.errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
          } else {
            this.errorMessage = 'Ocurrió un error inesperado. Intenta nuevamente.';
          }

          this.limpiarCodigo();
        },
      });
  }

  reenviarCodigo() {
    this.isResending = true;
    this.resendMessage = '';
    this.errorMessage = '';

    this.recuperacionService.reenviarCodigoRecuperacion(this.correoUsuario).subscribe({
      next: (response) => {
        this.isResending = false;
        this.resendMessage = 'Código reenviado exitosamente. Revisa tu correo.';
        this.limpiarCodigo();

        setTimeout(() => {
          this.resendMessage = '';
        }, 5000);
      },
      error: (error) => {
        this.isResending = false;
        console.error('Error al reenviar código:', error);

        if (error.status === 400) {
          this.errorMessage = error.error?.error || 'Error al reenviar el código';
        } else {
          this.errorMessage = 'No se pudo reenviar el código. Intenta nuevamente.';
        }
      },
    });
  }

  limpiarCodigo() {
    const inputs = this.inputsContainer.nativeElement.querySelectorAll('input');
    inputs.forEach((input, i) => {
      (input as HTMLInputElement).value = '';
      this.pinForm.get(`digit${i}`)?.setValue('');
    });
    (inputs[0] as HTMLInputElement)?.focus();
  }

  emitirVolver() {
    this.volver.emit();
  }
}
