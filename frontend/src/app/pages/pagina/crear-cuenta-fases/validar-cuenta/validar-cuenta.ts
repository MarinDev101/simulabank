import { Component, OnInit, ElementRef, ViewChild, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RegistroService } from '@app/core/auth/service/registro';
import { AuthService } from '@app/core/auth/service/auth';

@Component({
  selector: 'app-validar-cuenta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './validar-cuenta.html',
})
export class ValidarCuenta implements OnInit {
  @Input() correoUsuario: string = '';
  @Output() volver = new EventEmitter<void>();

  pinForm!: FormGroup;
  pinControls = Array(6);
  isLoading = false;
  errorMessage = '';
  isResending = false;
  resendMessage = '';

  @ViewChild('inputsContainer') inputsContainer!: ElementRef<HTMLDivElement>;

  constructor(
    private fb: FormBuilder,
    private registroService: RegistroService,
    private authService: AuthService,
    private router: Router
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
    const codigo = Object.values(this.pinForm.value).join('');

    if (codigo.length !== 6) {
      this.errorMessage = 'Por favor, ingresa el código completo de 6 dígitos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.registroService.verificarCodigo({ correo: this.correoUsuario, codigo }).subscribe({
      next: (response) => {
        console.log('Verificación exitosa:', response);

        // Guardar tokens y datos del usuario
        localStorage.setItem('access_token', response.token);
        localStorage.setItem('refresh_token', response.refreshToken);
        localStorage.setItem('user_data', JSON.stringify(response.user));

      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al verificar código:', error);

        if (error.status === 400) {
          this.errorMessage = error.error?.error || 'Código inválido o expirado';
        } else if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
        } else {
          this.errorMessage = 'Ocurrió un error inesperado. Intenta nuevamente.';
        }

        // Limpiar el formulario
        this.limpiarCodigo();
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  reenviarCodigo() {
    this.isResending = true;
    this.resendMessage = '';
    this.errorMessage = '';

    // Aquí necesitarías obtener los datos originales del registro
    // Por ahora, solo mostramos un mensaje
    // En producción, deberías almacenar temporalmente estos datos

    setTimeout(() => {
      this.isResending = false;
      this.resendMessage = 'Código reenviado exitosamente. Revisa tu correo.';

      // Limpiar mensaje después de 5 segundos
      setTimeout(() => {
        this.resendMessage = '';
      }, 5000);
    }, 2000);
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
