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

const CODE_COOLDOWN_KEY = 'codigo_cooldown_recuperacion'; // Cooldown global para recuperación
const COOLDOWN_TIME = 300000; // 5 minutos en milisegundos

@Component({
  selector: 'app-solicitud',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './solicitud.html',
})
export class Solicitud implements OnInit, OnDestroy {
  @Input() datosGuardados: { correo: string } | null = null;
  @Output() continuar = new EventEmitter<{ correo: string }>();

  form!: FormGroup;
  isLoading = false;
  errorMessage = '';

  // Rate limiting
  cooldownSeconds = 0;
  cooldownInterval: any = null;

  constructor(
    private fb: FormBuilder,
    private recuperacionService: RecuperacionService
  ) {
    this.form = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
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
        this.errorMessage = `Debes esperar ${this.cooldownSeconds} segundos antes de solicitar otro código.`;
        return;
      }
    }

    this.isLoading = true;
    this.errorMessage = '';

    const correo = this.form.value.correo;

    this.recuperacionService.solicitarRecuperacion({ correo }).subscribe({
      next: (response) => {
        console.log('Código de recuperación enviado:', response);
        // Guardar cooldown global
        this.guardarCooldown();
        this.cooldownSeconds = 300;
        this.iniciarContadorCooldown();
        this.continuar.emit({ correo });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al solicitar recuperación:', error);

        if (error.status === 404) {
          this.errorMessage = 'No existe una cuenta con este correo electrónico';
        } else if (error.status === 400 && error.error?.error) {
          this.errorMessage = error.error.error;
        } else if (error.status === 429) {
          this.errorMessage = 'Demasiadas solicitudes. Espera un momento antes de intentar de nuevo.';
          this.guardarCooldown();
          this.cooldownSeconds = 300;
          this.iniciarContadorCooldown();
        } else if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
        } else {
          this.errorMessage = 'Ocurrió un error inesperado. Intenta nuevamente.';
        }
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }
}
