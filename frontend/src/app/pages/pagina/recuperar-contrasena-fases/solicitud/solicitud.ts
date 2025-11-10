import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { RecuperacionService } from '@app/core/auth/service/recuperacion';

@Component({
  selector: 'app-solicitud',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './solicitud.html',
})
export class Solicitud {
  @Output() continuar = new EventEmitter<{ correo: string }>();

  form!: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private recuperacionService: RecuperacionService
  ) {
    this.form = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const correo = this.form.value.correo;

    this.recuperacionService.solicitarRecuperacion({ correo }).subscribe({
      next: (response) => {
        console.log('Código de recuperación enviado:', response);
        this.continuar.emit({ correo });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al solicitar recuperación:', error);

        if (error.status === 404) {
          this.errorMessage = 'No existe una cuenta con este correo electrónico';
        } else if (error.status === 400 && error.error?.error) {
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
