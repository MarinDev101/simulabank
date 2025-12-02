import { Component, EventEmitter, Output, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { RecuperacionService } from '@app/core/auth/service/recuperacion';
import { AlertService } from '@app/services/alert/alert.service';
import { EmailFormatDirective } from '@app/shared/directives';
import { VALIDATION_CONFIG, emailRobustoValidator } from '@app/shared/validators';

const CODE_COOLDOWN_KEY = 'codigo_cooldown_recuperacion'; // Cooldown global para recuperación
const COOLDOWN_TIME = 300000; // 5 minutos en milisegundos

@Component({
  selector: 'app-solicitud',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EmailFormatDirective],
  templateUrl: './solicitud.html',
})
export class Solicitud implements OnInit, OnDestroy {
  @Input() datosGuardados: { correo: string } | null = null;
  @Output() continuar = new EventEmitter<{ correo: string }>();

  form!: FormGroup;
  isLoading = false;

  // Rate limiting
  cooldownSeconds = 0;
  cooldownInterval: any = null;

  constructor(
    private fb: FormBuilder,
    private recuperacionService: RecuperacionService,
    private alertService: AlertService
  ) {
    this.form = this.fb.group({
      correo: [
        '',
        [
          Validators.required,
          Validators.maxLength(VALIDATION_CONFIG.email.maxLength),
          emailRobustoValidator(),
        ],
      ],
    });
  }

  ngOnInit(): void {
    // Verificar cooldown global al cargar
    this.verificarCooldownExistente();

    // Cargar datos guardados si existen (cuando el usuario vuelve del paso 2)
    if (this.datosGuardados?.correo) {
      this.form.patchValue({
        correo: this.datosGuardados.correo
      });
    }
  }

  ngOnDestroy(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }

  private verificarCooldownExistente(): void {
    const lastSent = localStorage.getItem(CODE_COOLDOWN_KEY);

    if (lastSent) {
      const elapsed = Date.now() - parseInt(lastSent, 10);
      const remaining = COOLDOWN_TIME - elapsed;

      if (remaining > 0) {
        this.cooldownSeconds = Math.ceil(remaining / 1000);
        this.iniciarContadorCooldown();
      } else {
        localStorage.removeItem(CODE_COOLDOWN_KEY);
      }
    }
  }

  private guardarCooldown(): void {
    localStorage.setItem(CODE_COOLDOWN_KEY, Date.now().toString());
  }

  private iniciarContadorCooldown(): void {
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

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Verificar cooldown global antes de enviar
    const lastSent = localStorage.getItem(CODE_COOLDOWN_KEY);

    if (lastSent) {
      const elapsed = Date.now() - parseInt(lastSent, 10);
      const remaining = COOLDOWN_TIME - elapsed;

      if (remaining > 0) {
        this.cooldownSeconds = Math.ceil(remaining / 1000);
        this.iniciarContadorCooldown();
        this.alertService.warning('Espera un momento', `Debes esperar ${this.cooldownSeconds} segundos antes de solicitar otro código.`);
        return;
      }
    }

    this.isLoading = true;

    const correo = this.form.value.correo;

    this.recuperacionService.solicitarRecuperacion({ correo }).subscribe({
      next: () => {
        this.alertService.toastSuccess('Código de recuperación enviado a tu correo');
        // Guardar cooldown global
        this.guardarCooldown();
        this.cooldownSeconds = 300;
        this.iniciarContadorCooldown();
        this.continuar.emit({ correo });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al solicitar recuperación:', error);

        let mensaje = 'Ocurrió un error inesperado. Intenta nuevamente.';

        if (error.status === 404) {
          mensaje = 'No existe una cuenta con este correo electrónico';
        } else if (error.status === 400 && error.error?.error) {
          mensaje = error.error.error;
        } else if (error.status === 429) {
          mensaje = 'Demasiadas solicitudes. Espera un momento antes de intentar de nuevo.';
          this.guardarCooldown();
          this.cooldownSeconds = 300;
          this.iniciarContadorCooldown();
        } else if (error.status === 0) {
          mensaje = 'No se pudo conectar con el servidor. Verifica tu conexión.';
        }

        this.alertService.error('Error', mensaje);
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }
}
