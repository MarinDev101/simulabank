import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RegistroService } from '@app/core/auth/service/registro';
import { AlertService } from '@app/services/alert/alert.service';
import { ImageCropperService } from '@app/services/image-cropper/image-cropper.service';

@Component({
  selector: 'app-personalizar-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personalizar-perfil.html',
})
export class PersonalizarPerfil implements OnInit {
  @Output() volver = new EventEmitter<void>();

  // Configuración de edad
  readonly EDAD_MINIMA = 13;
  readonly EDAD_MAXIMA = 100;

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

  // Estado de validación
  fechaTocada = false;
  generoTocado = false;

  constructor(
    private registroService: RegistroService,
    private router: Router,
    private alertService: AlertService,
    private imageCropperService: ImageCropperService
  ) {}

  ngOnInit(): void {
    // Días del 1 al 31 (se ajustará dinámicamente)
    this.dias = Array.from({ length: 31 }, (_, i) => i + 1);

    // Años: desde hace EDAD_MAXIMA años hasta hace EDAD_MINIMA años
    const anioActual = new Date().getFullYear();
    const anioMinimo = anioActual - this.EDAD_MAXIMA; // Edad máxima (ej: 1925)
    const anioMaximo = anioActual - this.EDAD_MINIMA; // Edad mínima (ej: 2007)

    // Crear array de años desde el más reciente al más antiguo
    this.anios = Array.from(
      { length: anioMaximo - anioMinimo + 1 },
      (_, i) => anioMaximo - i
    );
  }

  /**
   * Actualiza los días disponibles según el mes y año seleccionados
   */
  actualizarDias(): void {
    const mes = parseInt(this.fechaNacimiento.mes);
    const anio = parseInt(this.fechaNacimiento.anio);

    if (!mes) {
      this.dias = Array.from({ length: 31 }, (_, i) => i + 1);
      return;
    }

    let diasEnMes = 31;

    // Meses con 30 días
    if ([4, 6, 9, 11].includes(mes)) {
      diasEnMes = 30;
    }
    // Febrero
    else if (mes === 2) {
      // Verificar si es año bisiesto
      if (anio && this.esAnioBisiesto(anio)) {
        diasEnMes = 29;
      } else {
        diasEnMes = 28;
      }
    }

    this.dias = Array.from({ length: diasEnMes }, (_, i) => i + 1);

    // Si el día seleccionado es mayor al máximo del mes, ajustarlo
    if (parseInt(this.fechaNacimiento.dia) > diasEnMes) {
      this.fechaNacimiento.dia = '';
    }
  }

  /**
   * Verifica si un año es bisiesto
   */
  private esAnioBisiesto(anio: number): boolean {
    return (anio % 4 === 0 && anio % 100 !== 0) || (anio % 400 === 0);
  }

  /**
   * Verifica si el usuario ha empezado a llenar la fecha (al menos un campo)
   */
  get fechaIniciada(): boolean {
    return !!(this.fechaNacimiento.dia || this.fechaNacimiento.mes || this.fechaNacimiento.anio);
  }

  /**
   * Verifica si la fecha de nacimiento está completa
   */
  get fechaCompleta(): boolean {
    return !!(this.fechaNacimiento.dia && this.fechaNacimiento.mes && this.fechaNacimiento.anio);
  }

  /**
   * Verifica si la fecha está incompleta (empezó pero no terminó)
   */
  get fechaIncompleta(): boolean {
    return this.fechaIniciada && !this.fechaCompleta;
  }

  /**
   * Verifica si la fecha es válida (mayor de edad)
   */
  get fechaValida(): boolean {
    if (!this.fechaCompleta) return true; // Si no está completa, no mostrar error de edad

    const fechaNac = new Date(
      parseInt(this.fechaNacimiento.anio),
      parseInt(this.fechaNacimiento.mes) - 1,
      parseInt(this.fechaNacimiento.dia)
    );

    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mesActual = hoy.getMonth();
    const mesNac = fechaNac.getMonth();

    if (mesActual < mesNac || (mesActual === mesNac && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }

    return edad >= this.EDAD_MINIMA;
  }

  /**
   * Calcula la edad a partir de la fecha de nacimiento
   */
  get edadCalculada(): number | null {
    if (!this.fechaCompleta) return null;

    const fechaNac = new Date(
      parseInt(this.fechaNacimiento.anio),
      parseInt(this.fechaNacimiento.mes) - 1,
      parseInt(this.fechaNacimiento.dia)
    );

    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mesActual = hoy.getMonth();
    const mesNac = fechaNac.getMonth();

    if (mesActual < mesNac || (mesActual === mesNac && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }

    return edad;
  }

  /**
   * Marca la fecha como tocada para mostrar validaciones
   */
  marcarFechaTocada(): void {
    this.fechaTocada = true;
  }

  /**
   * Marca el género como tocado para mostrar validaciones
   */
  marcarGeneroTocado(): void {
    this.generoTocado = true;
  }

  /**
   * Limpia la selección de fecha de nacimiento
   */
  limpiarFecha(): void {
    this.fechaNacimiento = { dia: '', mes: '', anio: '' };
    this.fechaTocada = false;
    this.actualizarDias();
  }

  /**
   * Limpia la selección de género
   */
  limpiarGenero(): void {
    this.genero = '';
    this.generoTocado = false;
  }

  /**
   * Limpia la foto de perfil seleccionada
   */
  limpiarFoto(): void {
    this.fotoPerfil = '';
  }

  // Método para manejar la subida de foto con recorte
  async onFotoSeleccionada(event: any) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    // Validar que sea jpeg o png
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      this.alertService.error('Formato no válido', 'Solo se permiten imágenes en formato JPEG o PNG.');
      return;
    }

    // Validar tamaño máximo de 2MB
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      this.alertService.error('Archivo muy grande', 'El tamaño máximo permitido es de 2MB.');
      return;
    }

    // Abrir el modal de recorte
    try {
      const result = await this.imageCropperService.openCropper(file, {
        aspectRatio: 1,
        resizeToWidth: 400,
        resizeToHeight: 400,
        roundCropper: true,
        format: 'png',
        quality: 92,
        title: 'Recortar Foto',
        confirmButtonText: 'Aplicar recorte',
        cancelButtonText: 'Cancelar',
      });

      if (result) {
        // Se aplicó el recorte - guardar la imagen como base64
        this.fotoPerfil = result.base64;
        this.alertService.toastSuccess('Foto recortada correctamente');
      }
      // Si result es null, el usuario canceló
    } catch (err) {
      console.error('Error al abrir el cropper', err);
      this.alertService.error('Error', 'No se pudo procesar la imagen. Intenta de nuevo.');
    }

    // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
    event.target.value = '';
  }

  // Guardar perfil y redirigir al login
  guardarPerfil() {
    // Obtener usuario del localStorage
    const userData = localStorage.getItem('user_data');
    if (!userData) {
      this.alertService.error('Error', 'No se encontró información del usuario');
      return;
    }

    const user = JSON.parse(userData);
    this.isLoading = true;

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
        this.alertService.toastSuccess('¡Perfil guardado correctamente!');
        // Limpiar localStorage y redirigir al login
        this.limpiarYRedirigir();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al actualizar perfil:', error);
        this.alertService.error('Error', 'Error al guardar el perfil. Intenta nuevamente.');
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

    // Mostrar mensaje de redirección
    this.alertService.toastInfo('Redirigiendo al inicio de sesión...');

    // Redirigir al login con un pequeño delay
    setTimeout(() => {
      this.router.navigate(['/iniciar-sesion']);
    }, 1000);
  }
}
