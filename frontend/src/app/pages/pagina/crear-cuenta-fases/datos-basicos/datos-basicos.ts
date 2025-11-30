import { Component, EventEmitter, Output, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { RecaptchaModule, RecaptchaFormsModule } from 'ng-recaptcha-2';
import { RouterModule, Router } from '@angular/router';
import { RegistroService } from '@app/core/auth/service/registro';
import { environment } from '../../../../../environments/environment';

const FORM_STORAGE_KEY = 'registro_datos_temporales';
const CODE_COOLDOWN_KEY = 'codigo_cooldown_registro'; // Cooldown global para registro
const COOLDOWN_TIME = 300000; // 5 minutos en milisegundos

@Component({
  selector: 'app-datos-basicos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RecaptchaModule, RecaptchaFormsModule, RouterModule],
  templateUrl: './datos-basicos.html',
})
export class DatosBasicos implements OnInit, OnDestroy {
  @Input() datosGuardados: any = null; // Datos que vienen del paso 2 al volver
  @Output() continuar = new EventEmitter<{ correo: string }>();

  formCrearCuenta!: FormGroup;
  mostrarContrasena = false;
  mostrarConfirmarContrasena = false;
  isLoading = false;
  errorMessage = '';

  siteKey = environment.recaptchaSiteKey;

  // Rate limiting
  cooldownSeconds = 0;
  cooldownInterval: any = null;

  indicaciones = {
    longitud: false,
    numero: false,
    mayuscula: false,
    simbolo: false,
  };

  constructor(
    private fb: FormBuilder,
    private registroService: RegistroService,
    private router: Router
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

  ngOnInit(): void {
    // Verificar cooldown global al cargar
    this.verificarCooldownExistente();

    // Primero intentar cargar desde el Input (cuando vuelve del paso 2)
    if (this.datosGuardados) {
      this.cargarDatosDesdeInput();
    } else {
      // Si no hay datos del Input, intentar cargar desde sessionStorage (términos/privacidad)
      this.cargarDatosDesdeSessionStorage();
    }
  }

  ngOnDestroy(): void {
    // Limpiar intervalo de cooldown
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }

  private verificarCooldownExistente(): void {
    const lastSent = localStorage.getItem(CODE_COOLDOWN_KEY);

    if (lastSent) {
      const elapsed = Date.now() - parseInt(lastSent, 10);
      const remaining = COOLDOWN_TIME - elapsed;

      if (remaining > 0) {
        this.cooldownSeconds = Math.ceil(remaining / 1000);
        this.iniciarContadorCooldown();
      } else {
        localStorage.removeItem(CODE_COOLDOWN_KEY);
      }
    }
  }

  private guardarCooldown(): void {
    localStorage.setItem(CODE_COOLDOWN_KEY, Date.now().toString());
  }

  private iniciarContadorCooldown(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }

    this.cooldownInterval = setInterval(() => {
      this.cooldownSeconds--;
      if (this.cooldownSeconds <= 0) {
        clearInterval(this.cooldownInterval);
        this.cooldownInterval = null;
      }
    }, 1000);
  }

  private cargarDatosDesdeInput(): void {
    if (this.datosGuardados) {
      this.formCrearCuenta.patchValue({
        nombre: this.datosGuardados.nombres || this.datosGuardados.nombre || '',
        apellido: this.datosGuardados.apellidos || this.datosGuardados.apellido || '',
        correo: this.datosGuardados.correo || '',
        contrasena: this.datosGuardados.contrasena || '',
        confirmarContrasena: this.datosGuardados.contrasena || '',
        terminos: true, // Ya había aceptado los términos
      });
      // Verificar indicaciones si hay contraseña
      if (this.datosGuardados.contrasena) {
        this.verificarIndicaciones();
      }
    }
  }

  private cargarDatosDesdeSessionStorage(): void {
    const datosGuardados = sessionStorage.getItem(FORM_STORAGE_KEY);
    if (datosGuardados) {
      try {
        const datos = JSON.parse(datosGuardados);
        this.formCrearCuenta.patchValue({
          nombre: datos.nombre || '',
          apellido: datos.apellido || '',
          correo: datos.correo || '',
          contrasena: datos.contrasena || '',
          confirmarContrasena: datos.confirmarContrasena || '',
          terminos: datos.terminos || false,
        });
        // Verificar indicaciones si hay contraseña
        if (datos.contrasena) {
          this.verificarIndicaciones();
        }
        // Limpiar después de cargar
        sessionStorage.removeItem(FORM_STORAGE_KEY);
      } catch (e) {
        sessionStorage.removeItem(FORM_STORAGE_KEY);
      }
    }
  }

  private guardarDatosFormulario(): void {
    const datos = {
      nombre: this.f['nombre'].value,
      apellido: this.f['apellido'].value,
      correo: this.f['correo'].value,
      contrasena: this.f['contrasena'].value,
      confirmarContrasena: this.f['confirmarContrasena'].value,
      terminos: this.f['terminos'].value,
    };
    sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(datos));
  }

  navegarATerminos(): void {
    this.guardarDatosFormulario();
    this.router.navigate(['/terminos-condiciones']);
  }

  navegarAPoliticas(): void {
    this.guardarDatosFormulario();
    this.router.navigate(['/politicas-privacidad']);
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

    // Verificar cooldown global antes de enviar
    const lastSent = localStorage.getItem(CODE_COOLDOWN_KEY);

    if (lastSent) {
      const elapsed = Date.now() - parseInt(lastSent, 10);
      const remaining = COOLDOWN_TIME - elapsed;

      if (remaining > 0) {
        this.cooldownSeconds = Math.ceil(remaining / 1000);
        this.iniciarContadorCooldown();
        this.errorMessage = `Debes esperar ${this.cooldownSeconds} segundos antes de solicitar otro código.`;
        return;
      }
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
        // Guardar cooldown global
        this.guardarCooldown();
        this.cooldownSeconds = 300;
        this.iniciarContadorCooldown();
        // Emitir todos los datos para poder reenviar el código después
        this.continuar.emit(datos);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al enviar código:', error);

        if (error.status === 400 && error.error?.error) {
          this.errorMessage = error.error.error;
        } else if (error.status === 429) {
          this.errorMessage = 'Demasiadas solicitudes. Espera un momento antes de intentar de nuevo.';
          this.guardarCooldown();
          this.cooldownSeconds = 300;
          this.iniciarContadorCooldown();
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
