import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { RecaptchaModule, RecaptchaFormsModule } from 'ng-recaptcha-2';
import { RegistroService } from '@app/core/auth/service/registro';

@Component({
  selector: 'app-datos-basicos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RecaptchaModule, RecaptchaFormsModule],
  templateUrl: './datos-basicos.html',
})
export class DatosBasicos {
  @Output() continuar = new EventEmitter<{ correo: string }>();

  formCrearCuenta!: FormGroup;
  mostrarContrasena = false;
  mostrarConfirmarContrasena = false;
  isLoading = false;
  errorMessage = '';

  siteKey = '6Ld1Y_krAAAAANnFX7riXM65MWDSuQMmEm1krU33';

  indicaciones = {
    longitud: false,
    numero: false,
    mayuscula: false,
    simbolo: false,
  };

  constructor(
    private fb: FormBuilder,
    private registroService: RegistroService
  ) {
    this.formCrearCuenta = this.fb.group(
      {
        nombre: [
          '',
          [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZÀ-ÿ\s]+$/)],
        ],
        apellido: [
          '',
          [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZÀ-ÿ\s]+$/)],
        ],
        correo: ['', [Validators.required, Validators.email]],
        contrasena: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/),
          ],
        ],
        confirmarContrasena: ['', Validators.required],
        terminos: [false, Validators.requiredTrue],
        recaptcha: [null, Validators.required],
      },
      { validators: this.validarContrasenas }
    );
  }

  get f(): { [key: string]: AbstractControl } {
    return this.formCrearCuenta.controls;
  }

  validarContrasenas(form: FormGroup) {
    const pass = form.get('contrasena')?.value;
    const confirmPass = form.get('confirmarContrasena')?.value;
    return pass === confirmPass ? null : { noCoinciden: true };
  }

  onRecaptchaResolved(token: string | null) {
    this.formCrearCuenta.patchValue({ recaptcha: token });
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

  validarCuenta() {
    if (this.formCrearCuenta.invalid) {
      this.formCrearCuenta.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const datos = {
      correo: this.f['correo'].value,
      nombres: this.f['nombre'].value,
      apellidos: this.f['apellido'].value,
      contrasena: this.f['contrasena'].value,
    };

    this.registroService.iniciarRegistro(datos).subscribe({
      next: (response) => {
        console.log('Código enviado exitosamente:', response);
        // Emitir todos los datos para poder reenviar el código después
        this.continuar.emit(datos);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al enviar código:', error);

        if (error.status === 400 && error.error?.error) {
          this.errorMessage = error.error.error;
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
