import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ReturnButton } from '@app/components/return-button/return-button';

@Component({
  selector: 'app-iniciar-sesion',
  standalone: true,
  imports: [ReactiveFormsModule, ReturnButton],
  templateUrl: './iniciar-sesion.html',
})
export class IniciarSesion {
  loginForm: FormGroup;
  showPassword = false;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;
    console.log('Iniciando sesión con:', email, password);
  }
}
