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

@Component({
  selector: 'app-datos-basicos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RecaptchaModule, RecaptchaFormsModule],
  templateUrl: './datos-basicos.html',
})
export class DatosBasicos {
  @Output() continuar = new EventEmitter<void>();

  formCrearCuenta!: FormGroup;
  mostrarContrasena = false;
  mostrarConfirmarContrasena = false;

  siteKey = '6Ld1Y_krAAAAANnFX7riXM65MWDSuQMmEm1krU33';

  indicaciones = {
    longitud: false,
    numero: false,
    mayuscula: false,
    simbolo: false,
  };

  constructor(private fb: FormBuilder) {
    this.formCrearCuenta = this.fb.group(
      {
        nombre: [
          '',
          [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZÁ-ÿ\s]+$/)],
        ],
        apellido: [
          '',
          [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZÁ-ÿ\s]+$/)],
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
    if (this.formCrearCuenta.valid) {
      console.log('Formulario válido:', this.formCrearCuenta.value);
      this.continuar.emit();
    } else {
      this.formCrearCuenta.markAllAsTouched();
    }
  }
}
