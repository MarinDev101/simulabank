import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RegistroService } from '@app/core/auth/service/registro';

@Component({
  selector: 'app-personalizar-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personalizar-perfil.html',
})
export class PersonalizarPerfil implements OnInit {
  @Output() volver = new EventEmitter<void>();

  dias: number[] = [];
  meses = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' },
  ];
  anios: number[] = [];

  fechaNacimiento = {
    dia: '',
    mes: '',
    anio: '',
  };

  genero: string = '';
  fotoPerfil: string = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private registroService: RegistroService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Días del 1 al 31
    this.dias = Array.from({ length: 31 }, (_, i) => i + 1);

    // Años desde el actual hasta 1900
    const anioActual = new Date().getFullYear();
    this.anios = Array.from({ length: anioActual - 1899 }, (_, i) => anioActual - i);
  }

  // Método para manejar la subida de foto (pendiente implementación completa)
  onFotoSeleccionada(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Aquí deberías implementar la lógica para subir la imagen
      // Por ahora, simulamos con una URL
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.fotoPerfil = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // Guardar perfil y redirigir al login
  guardarPerfil() {
    // Obtener usuario del localStorage
    const userData = localStorage.getItem('user_data');
    if (!userData) {
      this.errorMessage = 'No se encontró información del usuario';
      return;
    }

    const user = JSON.parse(userData);
    this.isLoading = true;
    this.errorMessage = '';

    // Construir fecha de nacimiento si está completa
    let fechaNacimientoCompleta = null;
    if (this.fechaNacimiento.dia && this.fechaNacimiento.mes && this.fechaNacimiento.anio) {
      fechaNacimientoCompleta = `${this.fechaNacimiento.anio}-${String(this.fechaNacimiento.mes).padStart(2, '0')}-${String(this.fechaNacimiento.dia).padStart(2, '0')}`;
    }

    // Preparar datos para enviar
    const datosActualizar = {
      userId: user.id,
      ...(this.fotoPerfil && { foto_perfil: this.fotoPerfil }),
      ...(fechaNacimientoCompleta && { fecha_nacimiento: fechaNacimientoCompleta }),
      ...(this.genero && { genero: this.genero }),
    };

    // Llamar al servicio para actualizar
    this.registroService.actualizarPerfilInicial(datosActualizar).subscribe({
      next: (response) => {
        console.log('Perfil actualizado:', response);
        // Limpiar localStorage y redirigir al login
        this.limpiarYRedirigir();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al actualizar perfil:', error);
        this.errorMessage = 'Error al guardar el perfil. Intenta nuevamente.';
      },
    });
  }

  // Omitir personalización y redirigir al login
  omitirPaso() {
    this.limpiarYRedirigir();
  }

  // Método para limpiar tokens y redirigir al login
  private limpiarYRedirigir() {
    // Limpiar tokens para que el usuario deba iniciar sesión
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');

    // Redirigir al login con un pequeño delay
    setTimeout(() => {
      this.router.navigate(['/iniciar-sesion'], {
        queryParams: { mensaje: 'Cuenta creada exitosamente. Por favor, inicia sesión.' },
      });
    }, 500);
  }
}
