import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { HeaderBasico } from '@app/core/layout/headers/header-basico/header-basico';
import { Footer } from '@app/core/layout/footer/footer';
import { RecaptchaModule, RecaptchaFormsModule } from 'ng-recaptcha';

@Component({
  selector: 'app-crear-cuenta',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HeaderBasico,
    Footer,
    RecaptchaModule,
    RecaptchaFormsModule,
  ],
  templateUrl: './crear-cuenta.html',
})
export class CrearCuenta {
  formCrearCuenta!: FormGroup;
  submitted = false;
  mostrarContrasena = false;
  mostrarConfirmarContrasena = false;

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
        captcha: [false, Validators.requiredTrue],
      },
      { validators: this.validarContrasenas }
    );

    // Reemplazar el captcha simple por el recaptcha
    this.formCrearCuenta.removeControl('captcha');
    this.formCrearCuenta.addControl('recaptcha', this.fb.control(null, Validators.required));
  }

  onRecaptchaResolved(token: string | null) {
    if (token) {
      this.formCrearCuenta.patchValue({
        recaptcha: token,
      });
    }
  }

  // --- Getter genérico para usar en plantilla: f.nombre, f['nombre'], etc.
  get f(): { [key: string]: AbstractControl } {
    return this.formCrearCuenta.controls;
  }

  // --- Getters individuales en caso de que tu template use directamente 'nombre', 'apellido', etc.
  get nombre() {
    return this.formCrearCuenta.get('nombre');
  }
  get apellido() {
    return this.formCrearCuenta.get('apellido');
  }
  get correo() {
    return this.formCrearCuenta.get('correo');
  }
  get contrasena() {
    return this.formCrearCuenta.get('contrasena');
  }
  get confirmarContrasena() {
    return this.formCrearCuenta.get('confirmarContrasena');
  }
  get terminos() {
    return this.formCrearCuenta.get('terminos');
  }
  get captcha() {
    return this.formCrearCuenta.get('captcha');
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

  validarCuenta() {
    this.submitted = true;
    if (this.formCrearCuenta.valid) {
      console.log('✅ Formulario válido:', this.formCrearCuenta.value);
      // enviar al backend...
    } else {
      console.warn('❌ Formulario inválido');
      this.formCrearCuenta.markAllAsTouched();
    }
  }
}
