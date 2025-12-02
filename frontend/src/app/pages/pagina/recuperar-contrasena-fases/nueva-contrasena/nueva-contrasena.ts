import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Router } from '@angular/router';
import { RecuperacionService } from '@app/core/auth/service/recuperacion';
import { AlertService } from '@app/services/alert/alert.service';
import { PasswordFormatDirective } from '@app/shared/directives';
import {
  VALIDATION_CONFIG,
  passwordFuerteValidator,
  confirmarContrasenaValidator,
  verificarIndicadoresPassword,
} from '@app/shared/validators';

@Component({
  selector: 'app-nueva-contrasena',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PasswordFormatDirective],
  templateUrl: './nueva-contrasena.html',
})
export class NuevaContrasena {
  @Output() volver = new EventEmitter<void>();

  formNuevaContrasena!: FormGroup;
  mostrarContrasena = false;
  mostrarConfirmarContrasena = false;
  isLoading = false;

  indicaciones = {
    longitud: false,
    numero: false,
    mayuscula: false,
    simbolo: false,
  };

  constructor(
    private fb: FormBuilder,
    private recuperacionService: RecuperacionService,
    private router: Router,
    private alertService: AlertService
  ) {
    this.formNuevaContrasena = this.fb.group(
      {
        contrasena: [
          '',
          [
            Validators.required,
            Validators.minLength(VALIDATION_CONFIG.password.minLength),
            Validators.maxLength(VALIDATION_CONFIG.password.maxLength),
            passwordFuerteValidator(),
          ],
        ],
        confirmarContrasena: ['', Validators.required],
      },
      { validators: confirmarContrasenaValidator('contrasena', 'confirmarContrasena') }
    );
  }

  get f(): { [key: string]: AbstractControl } {
    return this.formNuevaContrasena.controls;
  }

  toggleContrasena() {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  toggleConfirmarContrasena() {
    this.mostrarConfirmarContrasena = !this.mostrarConfirmarContrasena;
  }

  verificarIndicaciones() {
    const valor = this.f['contrasena'].value || '';
    const indicadores = verificarIndicadoresPassword(valor);
    this.indicaciones = {
      longitud: indicadores.longitud,
      numero: indicadores.numero,
      mayuscula: indicadores.mayuscula && indicadores.minuscula,
      simbolo: indicadores.simbolo,
    };
  }

  restablecerContrasena() {
    if (this.formNuevaContrasena.invalid) {
      this.formNuevaContrasena.markAllAsTouched();
      return;
    }

    // Obtener token temporal del localStorage
    const tokenTemporal = localStorage.getItem('token_recuperacion');
    if (!tokenTemporal) {
      this.alertService.error('Sesión expirada', 'Por favor, inicia el proceso nuevamente.');
      return;
    }

    this.isLoading = true;

    const datos = {
      token_temporal: tokenTemporal,
      nueva_contrasena: this.f['contrasena'].value,
    };

    this.recuperacionService.restablecerContrasena(datos).subscribe({
      next: (response) => {
        console.log('Contraseña restablecida exitosamente:', response);

        // Limpiar token temporal
        localStorage.removeItem('token_recuperacion');

        // Mostrar éxito
        this.alertService.success('¡Contraseña restablecida!', 'Tu contraseña ha sido cambiada exitosamente. Por favor, inicia sesión.');

        // Redirigir al login
        setTimeout(() => {
          this.router.navigate(['/iniciar-sesion']);
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al restablecer contraseña:', error);

        if (error.status === 400 && error.error?.error) {
          this.alertService.error('Error', error.error.error);
        } else if (error.status === 401) {
          this.alertService.error('Sesión expirada', 'Token inválido o expirado. Inicia el proceso nuevamente.');
        } else if (error.status === 0) {
          this.alertService.error('Error de conexión', 'No se pudo conectar con el servidor. Verifica tu conexión.');
        } else {
          this.alertService.error('Error', 'Ocurrió un error inesperado. Intenta nuevamente.');
        }
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  emitirVolver() {
    this.volver.emit();
  }
}
