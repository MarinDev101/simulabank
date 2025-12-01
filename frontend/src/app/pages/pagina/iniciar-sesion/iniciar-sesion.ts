import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '@app/core/auth/service/auth';
import { ReturnButton } from '@app/components/return-button/return-button';
import { AlertService } from '@app/services/alert/alert.service';

@Component({
  selector: 'app-iniciar-sesion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ReturnButton],
  templateUrl: './iniciar-sesion.html',
})
export class IniciarSesion implements OnInit {
  loginForm!: FormGroup;
  showPassword = false;
  isLoading = false;
  returnUrl = '';
  formInitialized = false; // nuevo flag

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    // Si ya está autenticado, redirigir según su rol
    if (this.authService.estaAutenticado()) {
      this.authService.navegarSegunRol();
      return;
    }

    // Obtener URL de retorno
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';

    // Inicializar formulario
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
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

    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (remember) localStorage.setItem('remember_user', 'true');

        // Mostrar toast de bienvenida
        const nombreUsuario = response.user?.nombres || 'Usuario';
        this.alertService.toastSuccess(`¡Bienvenido/a, ${nombreUsuario}!`);

        if (this.returnUrl) {
          this.router.navigateByUrl(this.returnUrl);
        } else {
          this.authService.navegarSegunRol(response.user);
        }
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
