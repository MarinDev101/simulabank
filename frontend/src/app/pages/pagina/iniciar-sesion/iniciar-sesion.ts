import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '@app/core/auth/service/auth';
import { ReturnButton } from '@app/components/return-button/return-button';

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
  errorMessage = '';
  returnUrl = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Verificar si ya está autenticado
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
    this.errorMessage = '';

    const { email, password, remember } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        console.log('Login exitoso:', response);

        // Si marcó "recordarme", guardar preferencia
        if (remember) {
          localStorage.setItem('remember_user', 'true');
        }

        // Redirigir a la URL de retorno o según rol
        if (this.returnUrl) {
          this.router.navigateByUrl(this.returnUrl);
        } else {
          this.authService.navegarSegunRol(response.user);
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error en login:', error);

        // Manejar diferentes tipos de errores
        if (error.status === 401) {
          this.errorMessage =
            'Credenciales incorrectas. Por favor, verifica tu correo y contraseña.';
        } else if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
        } else if (error.error?.error) {
          this.errorMessage = error.error.error;
        } else {
          this.errorMessage = 'Ocurrió un error inesperado. Intenta nuevamente.';
        }
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  // Marcar todos los campos como tocados para mostrar errores
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Helpers para validación en template
  get emailInvalid(): boolean {
    const control = this.loginForm.get('email');
    return !!(control?.invalid && control?.touched);
  }

  get passwordInvalid(): boolean {
    const control = this.loginForm.get('password');
    return !!(control?.invalid && control?.touched);
  }
}
