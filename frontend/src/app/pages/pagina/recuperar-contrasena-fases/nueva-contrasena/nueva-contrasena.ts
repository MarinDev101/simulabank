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

@Component({
  selector: 'app-nueva-contrasena',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './nueva-contrasena.html',
})
export class NuevaContrasena {
  @Output() volver = new EventEmitter<void>();

  formNuevaContrasena!: FormGroup;
  mostrarContrasena = false;
  mostrarConfirmarContrasena = false;
  isLoading = false;
  errorMessage = '';

  indicaciones = {
    longitud: false,
    numero: false,
    mayuscula: false,
    simbolo: false,
  };

  constructor(
    private fb: FormBuilder,
    private recuperacionService: RecuperacionService,
    private router: Router
  ) {
    this.formNuevaContrasena = this.fb.group(
      {
        contrasena: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/),
          ],
        ],
        confirmarContrasena: ['', Validators.required],
      },
      { validators: this.validarContrasenas }
    );
  }

  get f(): { [key: string]: AbstractControl } {
    return this.formNuevaContrasena.controls;
  }

  validarContrasenas(form: FormGroup) {
    const pass = form.get('contrasena')?.value;
    const confirmPass = form.get('confirmarContrasena')?.value;
    return pass === confirmPass ? null : { noCoinciden: true };
  }

  toggleContrasena() {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  toggleConfirmarContrasena() {
    this.mostrarConfirmarContrasena = !this.mostrarConfirmarContrasena;
  }

  verificarIndicaciones() {
    const valor = this.f['contrasena'].value || '';
    this.indicaciones = {
      longitud: valor.length >= 8,
      numero: /\d/.test(valor),
      mayuscula: /[A-Z]/.test(valor),
      simbolo: /[@$!%*?&]/.test(valor),
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
      this.errorMessage = 'Sesión expirada. Por favor, inicia el proceso nuevamente.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const datos = {
      token_temporal: tokenTemporal,
      nueva_contrasena: this.f['contrasena'].value,
    };

    this.recuperacionService.restablecerContrasena(datos).subscribe({
      next: (response) => {
        console.log('Contraseña restablecida exitosamente:', response);

        // Limpiar token temporal
        localStorage.removeItem('token_recuperacion');

        // Redirigir al login con mensaje de éxito
        setTimeout(() => {
          this.router.navigate(['/iniciar-sesion'], {
            queryParams: { mensaje: 'Contraseña restablecida exitosamente. Por favor, inicia sesión.' },
          });
        }, 1000);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al restablecer contraseña:', error);

        if (error.status === 400 && error.error?.error) {
          this.errorMessage = error.error.error;
        } else if (error.status === 401) {
          this.errorMessage = 'Token inválido o expirado. Inicia el proceso nuevamente.';
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

  emitirVolver() {
    this.volver.emit();
  }
}
