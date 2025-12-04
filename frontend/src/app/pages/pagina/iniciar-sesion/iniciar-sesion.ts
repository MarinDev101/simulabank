import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@app/core/auth/service/auth';
import { ReturnButton } from '@app/components/return-button/return-button';
import { AlertService } from '@app/services/alert/alert.service';
import { EmailFormatDirective, PasswordFormatDirective } from '@app/shared/directives';
import { VALIDATION_CONFIG, emailRobustoValidator } from '@app/shared/validators';

@Component({
  selector: 'app-iniciar-sesion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ReturnButton,
    EmailFormatDirective,
    PasswordFormatDirective,
  ],
  templateUrl: './iniciar-sesion.html',
})
export class IniciarSesion implements OnInit {
  loginForm!: FormGroup;
  showPassword = false;
  isLoading = false;
  formInitialized = false; // nuevo flag

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    // Si ya está autenticado, redirigir según su rol
    if (this.authService.estaAutenticado()) {
      this.authService.navegarSegunRol();
      return;
    }

    // Inicializar formulario
    this.loginForm = this.fb.group({
      email: [
        '',
        [
          Validators.required,
          Validators.maxLength(VALIDATION_CONFIG.email.maxLength),
          emailRobustoValidator(),
        ],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(VALIDATION_CONFIG.password.minLength),
          Validators.maxLength(VALIDATION_CONFIG.password.maxLength),
        ],
      ],
      remember: [false],
    });

    // Solución: esperar un tick antes de permitir mostrar errores
    setTimeout(() => {
      this.formInitialized = true;
      this.cd.detectChanges();
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;

    const { email, password, remember } = this.loginForm.value;

    this.authService.login(email, password, remember).subscribe({
      next: (response) => {
        this.isLoading = false;

        // Mostrar toast de bienvenida
        const nombreUsuario = response.user?.nombres || 'Usuario';
        this.alertService.toastSuccess(`¡Bienvenido/a, ${nombreUsuario}!`);

        // Siempre redirigir según el rol del usuario (ignorar returnUrl para evitar volver a páginas públicas)
        this.authService.navegarSegunRol(response.user);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error en login:', error);

        if (error.status === 401) {
          this.alertService.error('Credenciales incorrectas', 'Por favor, verifica tu correo y contraseña.');
        } else if (error.status === 0) {
          this.alertService.error('Error de conexión', 'No se pudo conectar con el servidor. Verifica tu conexión.');
        } else if (error.error?.error) {
          this.alertService.error('Error', error.error.error);
        } else {
          this.alertService.error('Error', 'Ocurrió un error inesperado. Intenta nuevamente.');
        }

        this.cd.detectChanges();
      },
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get emailInvalid(): boolean {
    const control = this.loginForm.get('email');
    return !!(control?.invalid && control?.touched);
  }

  get passwordInvalid(): boolean {
    const control = this.loginForm.get('password');
    return !!(control?.invalid && control?.touched);
  }
}
