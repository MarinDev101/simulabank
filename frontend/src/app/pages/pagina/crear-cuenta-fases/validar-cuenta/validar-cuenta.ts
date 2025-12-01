import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  Output,
  EventEmitter,
  Input,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RegistroService } from '@app/core/auth/service/registro';
import { AuthService } from '@app/core/auth/service/auth';
import { AlertService } from '@app/services/alert/alert.service';

const CODE_COOLDOWN_KEY = 'codigo_cooldown_registro'; // Mismo cooldown global que datos-basicos.ts
const COOLDOWN_TIME_MS = 300000; // 5 minutos en milisegundos

@Component({
  selector: 'app-validar-cuenta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './validar-cuenta.html',
})
export class ValidarCuenta implements OnInit, OnDestroy {
  @Input() correoUsuario: string = '';
  @Input() datosRegistro: any = null; // Recibir datos completos del registro
  @Output() volver = new EventEmitter<void>();
  @Output() continuar = new EventEmitter<void>();

  pinForm!: FormGroup;
  pinControls = Array(6);
  isLoading = false;
  isResending = false;

  // Rate limiting para reenvío de códigos
  cooldownSeconds = 0;
  cooldownInterval: any = null;

  @ViewChild('inputsContainer') inputsContainer!: ElementRef<HTMLDivElement>;

  constructor(
    private fb: FormBuilder,
    private registroService: RegistroService,
    private authService: AuthService,
    private router: Router,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    const group: any = {};
    for (let i = 0; i < 6; i++) {
      group[`digit${i}`] = ['', [Validators.pattern('[0-9]')]];
    }
    this.pinForm = this.fb.group(group);

    // Verificar cooldown global existente
    this.verificarCooldownExistente();
  }

  private verificarCooldownExistente(): void {
    const lastSent = localStorage.getItem(CODE_COOLDOWN_KEY);

    if (lastSent) {
      const elapsed = Date.now() - parseInt(lastSent, 10);
      const remaining = COOLDOWN_TIME_MS - elapsed;

      if (remaining > 0) {
        this.cooldownSeconds = Math.ceil(remaining / 1000);
        this.iniciarCooldown();
      } else {
        localStorage.removeItem(CODE_COOLDOWN_KEY);
      }
    }
  }

  private guardarCooldown(): void {
    localStorage.setItem(CODE_COOLDOWN_KEY, Date.now().toString());
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
      this.alertService.warning('Código incompleto', 'Por favor, ingresa el código completo de 6 dígitos');
      return;
    }

    this.isLoading = true;

    this.registroService.verificarCodigo({ correo: this.correoUsuario, codigo }).subscribe({
      next: (response: any) => {
        console.log('Verificación exitosa:', response);

        // Guardar tokens y datos del usuario
        localStorage.setItem('access_token', response.token);
        localStorage.setItem('refresh_token', response.refreshToken);
        localStorage.setItem('user_data', JSON.stringify(response.user));

        // Mostrar alerta de cuenta creada exitosamente
        this.alertService.success('¡Cuenta creada!', 'Tu cuenta ha sido creada exitosamente. Ahora puedes personalizar tu perfil.');

        // Continuar al siguiente paso (personalizar perfil)
        setTimeout(() => {
          this.isLoading = false;
          this.continuar.emit();
        }, 1500);
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error al verificar código:', error);

        if (error.status === 400) {
          this.alertService.error('Código inválido', error.error?.error || 'Código inválido o expirado');
        } else if (error.status === 0) {
          this.alertService.error('Error de conexión', 'No se pudo conectar con el servidor. Verifica tu conexión.');
        } else {
          this.alertService.error('Error', 'Ocurrió un error inesperado. Intenta nuevamente.');
        }

        this.limpiarCodigo();
      },
    });
  }

  // MÉTODO ACTUALIZADO: Reenviar código con datos reales y rate limiting
  reenviarCodigo() {
    if (!this.datosRegistro) {
      this.alertService.error('Error', 'No se encontraron los datos del registro');
      return;
    }

    // Verificar si está en cooldown
    if (this.cooldownSeconds > 0) {
      return;
    }

    this.isResending = true;

    // Llamar al servicio para reenviar el código
    this.registroService.reenviarCodigo(this.datosRegistro).subscribe({
      next: (response) => {
        this.isResending = false;

        // Mostrar toast de éxito
        this.alertService.toastSuccess('Código reenviado. Revisa tu correo.');

        // Iniciar cooldown y guardar en localStorage
        this.guardarCooldown();
        this.cooldownSeconds = 300;
        this.iniciarCooldown();

        // Limpiar campos y enfocar el primero
        this.limpiarCodigo();
      },
      error: (error) => {
        this.isResending = false;
        console.error('Error al reenviar código:', error);

        if (error.status === 400) {
          this.alertService.error('Error', error.error?.error || 'Error al reenviar el código');
        } else if (error.status === 429) {
          this.alertService.warning('Demasiadas solicitudes', 'Espera un momento antes de intentar de nuevo.');
          this.guardarCooldown();
          this.cooldownSeconds = 300;
          this.iniciarCooldown();
        } else {
          this.alertService.error('Error', 'No se pudo reenviar el código. Intenta nuevamente.');
        }
      },
    });
  }

  iniciarCooldown() {
    // Limpiar intervalo anterior si existe
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }

    this.cooldownInterval = setInterval(() => {
      this.cooldownSeconds--;
      if (this.cooldownSeconds <= 0) {
        clearInterval(this.cooldownInterval);
        this.cooldownInterval = null;
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
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
