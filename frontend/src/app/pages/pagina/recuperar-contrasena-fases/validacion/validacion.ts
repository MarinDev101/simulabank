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
import { RecuperacionService } from '@app/core/auth/service/recuperacion';
import { AlertService } from '@app/services/alert/alert.service';
import { SoloNumerosDirective } from '@app/shared/directives';

const CODE_COOLDOWN_KEY = 'codigo_cooldown_recuperacion'; // Mismo cooldown global que solicitud.ts
const COOLDOWN_TIME_MS = 60000; // 60 segundos en milisegundos

@Component({
  selector: 'app-validacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SoloNumerosDirective],
  templateUrl: './validacion.html',
})
export class Validacion implements OnInit, OnDestroy {
  @Input() correoUsuario: string = '';
  @Output() volver = new EventEmitter<void>();
  @Output() continuar = new EventEmitter<string>(); // Emitimos el token temporal

  pinForm!: FormGroup;
  pinControls = Array(6);
  isLoading = false;
  isResending = false;
  tokenTemporal = '';

  // Rate limiting para reenvío de códigos
  cooldownSeconds = 0;
  cooldownInterval: any = null;

  @ViewChild('inputsContainer') inputsContainer!: ElementRef<HTMLDivElement>;

  constructor(
    private fb: FormBuilder,
    private recuperacionService: RecuperacionService,
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
    const codigo = Object.values(this.pinForm.value)
      .map((v) => String(v || '').trim())
      .join('');

    if (codigo.length !== 6) {
      this.alertService.warning(
        'Código incompleto',
        'Por favor, ingresa el código completo de 6 dígitos'
      );
      return;
    }

    if (!/^\d+$/.test(codigo)) {
      this.alertService.warning('Código inválido', 'El código solo debe contener dígitos');
      return;
    }

    this.isLoading = true;

    this.recuperacionService
      .verificarCodigoRecuperacion({ correo: this.correoUsuario, codigo })
      .subscribe({
        next: (response: any) => {
          this.tokenTemporal = response.token_temporal;

          // Guardar token temporal en localStorage para usarlo en el siguiente paso
          localStorage.setItem('token_recuperacion', this.tokenTemporal);

          this.alertService.toastSuccess('Código verificado correctamente');

          setTimeout(() => {
            this.isLoading = false;
            this.continuar.emit(this.tokenTemporal);
          }, 1000);
        },
        error: (error: any) => {
          this.isLoading = false;

          let mensaje = 'Ocurrió un error inesperado. Intenta nuevamente.';

          if (error.status === 400) {
            mensaje = error.error?.error || 'Código inválido o expirado';
          } else if (error.status === 0) {
            mensaje = 'No se pudo conectar con el servidor. Verifica tu conexión.';
          }

          this.alertService.error('Error de verificación', mensaje);
          this.limpiarCodigo();
        },
      });
  }

  reenviarCodigo() {
    // Verificar si está en cooldown
    if (this.cooldownSeconds > 0) {
      return;
    }

    this.isResending = true;

    this.recuperacionService.reenviarCodigoRecuperacion(this.correoUsuario).subscribe({
      next: () => {
        this.isResending = false;
        this.alertService.toastSuccess('Código reenviado exitosamente. Revisa tu correo.');

        // Iniciar cooldown y guardar en localStorage
        this.guardarCooldown();
        this.cooldownSeconds = 60;
        this.iniciarCooldown();

        this.limpiarCodigo();
      },
      error: (error) => {
        this.isResending = false;

        let mensaje = 'No se pudo reenviar el código. Intenta nuevamente.';

        if (error.status === 400) {
          mensaje = error.error?.error || 'Error al reenviar el código';
        } else if (error.status === 429) {
          mensaje = 'Demasiadas solicitudes. Espera un momento antes de intentar de nuevo.';
          this.guardarCooldown();
          this.cooldownSeconds = 60;
          this.iniciarCooldown();
        }

        this.alertService.error('Error', mensaje);
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
