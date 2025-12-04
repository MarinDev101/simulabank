import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService, Usuario } from '@app/core/auth/service/auth';
import { RegistroService } from '@app/core/auth/service/registro';
import { AlertService } from '@app/services/alert/alert.service';
import { ImageCropperService } from '@app/services/image-cropper/image-cropper.service';
import { SoloLetrasDirective, PasswordFormatDirective } from '@app/shared/directives';
import { verificarIndicadoresPassword, VALIDATION_CONFIG } from '@app/shared/validators';
import { environment } from '../../../../environments/environment';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, SoloLetrasDirective, PasswordFormatDirective],
  templateUrl: './configuracion.html',
})
export class Configuracion implements OnInit, OnDestroy {
  // Tab activo
  activeTab: string = 'tab1';

  // Para limpiar suscripciones
  private destroy$ = new Subject<void>();

  // Configuración de edad
  readonly EDAD_MINIMA = 13;
  readonly EDAD_MAXIMA = 100;

  changeTab(tab: string) {
    this.activeTab = tab;
  }

  usuario: Usuario | null = null;

  // Fecha y género
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

  fechaNacimiento = { dia: '', mes: '', anio: '' };
  genero: string = '';
  fechaTocada = false;
  generoTocado = false;

  // Nombre / apellido (editable)
  nombre: string = '';
  apellido: string = '';

  // Foto
  fotoFile: File | null = null;
  fotoPreview: string | null = null;
  eliminarPending: boolean = false; // mark delete locally until update
  fotoChanged: boolean = false; // mark new photo selected

  // Flag para evitar resetear el formulario cuando solo cambia la foto
  private actualizandoFoto: boolean = false;

  isLoading = false;

  // Contraseña
  contrasenaActual = '';
  contrasenaNueva = '';
  contrasenaConfirmar = '';
  mostrarContrasena = false;
  mostrarContrasenaActual = false;
  mostrarConfirmarContrasena = false;
  indicaciones = { longitud: false, numero: false, mayuscula: false, simbolo: false };
  @ViewChild('passwordForm') passwordForm?: NgForm;

  constructor(
    private authService: AuthService,
    private registroService: RegistroService,
    private alertService: AlertService,
    private imageCropperService: ImageCropperService
  ) {
    this.usuario = this.authService.obtenerUsuario();
    if (this.usuario) {
      this.nombre = this.usuario.nombres || '';
      this.apellido = this.usuario.apellidos || '';
      this.genero = this.usuario.genero || '';
      this.fotoPreview = this.usuario.foto_perfil || null;
      if (this.usuario.fecha_nacimiento) {
        const parts = this.usuario.fecha_nacimiento.split('-');
        if (parts.length === 3) {
          this.fechaNacimiento.anio = parts[0];
          this.fechaNacimiento.mes = String(parseInt(parts[1], 10));
          this.fechaNacimiento.dia = String(parseInt(parts[2], 10));
        }
      }
    }

    // Rellenar días (se ajusta dinámicamente)
    this.dias = Array.from({ length: 31 }, (_, i) => i + 1);

    // Años: desde hace EDAD_MAXIMA años hasta hace EDAD_MINIMA años
    const anioActual = new Date().getFullYear();
    const anioMinimo = anioActual - this.EDAD_MAXIMA; // Edad máxima (ej: 1925)
    const anioMaximo = anioActual - this.EDAD_MINIMA; // Edad mínima (ej: 2012)
    this.anios = Array.from(
      { length: anioMaximo - anioMinimo + 1 },
      (_, i) => anioMaximo - i
    );
  }

  ngOnInit(): void {
    // Suscribirse a cambios del usuario para actualización automática
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      if (user) {
        this.usuario = user;
        this.actualizarCamposDesdeUsuario();
      }
    });

    // Cargar datos actualizados del servidor
    this.cargarPerfilDesdeServidor();

    // Ajustar días si ya hay fecha seleccionada
    if (this.fechaNacimiento.mes) {
      this.actualizarDias();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga el perfil del usuario desde el servidor y actualiza los campos
   */
  private cargarPerfilDesdeServidor(): void {
    this.authService.obtenerPerfilServidor().subscribe({
      next: (response) => {
        if (response.success && response.user) {
          this.usuario = response.user;
          this.actualizarCamposDesdeUsuario();
        }
      },
      error: (error) => {
        console.error('Error al cargar perfil:', error);
        // Si falla, mantener los datos locales
      }
    });
  }

  /**
   * Actualiza los campos del formulario con los datos del usuario.
   * Si se está actualizando solo la foto, no resetea los demás campos.
   */
  private actualizarCamposDesdeUsuario(): void {
    if (this.usuario) {
      // Si estamos actualizando solo la foto, solo actualizar fotoPreview
      if (this.actualizandoFoto) {
        this.fotoPreview = this.usuario.foto_perfil || null;
        return;
      }

      this.nombre = this.usuario.nombres || '';
      this.apellido = this.usuario.apellidos || '';
      this.genero = this.usuario.genero || '';
      this.fotoPreview = this.usuario.foto_perfil || null;
      if (this.usuario.fecha_nacimiento) {
        const parts = this.usuario.fecha_nacimiento.split('-');
        if (parts.length === 3) {
          this.fechaNacimiento.anio = parts[0];
          this.fechaNacimiento.mes = String(parseInt(parts[1], 10));
          this.fechaNacimiento.dia = String(parseInt(parts[2], 10));
          this.actualizarDias();
        }
      }
    }
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
   * Verifica si la fecha es válida (mayor de edad mínima)
   */
  get fechaValida(): boolean {
    if (!this.fechaCompleta) return true; // Si no está completa, no mostrar error

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
  }

  // Getters
  get correo(): string {
    return this.usuario?.correo || 'Sin correo';
  }

  get nombreCompleto(): string {
    if (!this.usuario) return 'Usuario';
    return `${this.usuario.nombres} ${this.usuario.apellidos}`;
  }

  get rolBadge(): { text: string; color: string } {
    if (!this.usuario || !this.usuario.rol) return { text: 'Usuario', color: 'bg-gray-500' };
    switch (this.usuario.rol) {
      case 'administrador':
        return { text: 'Administrador', color: 'bg-purple-600' };
      case 'instructor':
        return { text: 'Instructor', color: 'bg-blue-600' };
      case 'aprendiz':
        return { text: 'Aprendiz', color: 'bg-green-600' };
      default:
        return { text: 'Usuario', color: 'bg-gray-500' };
    }
  }

  get politicasRoute(): string {
    if (!this.usuario?.rol) return '/politicas-privacidad';
    return `/${this.usuario.rol}/politicas-plataforma`;
  }

  get informacionRoute(): string {
    if (!this.usuario?.rol) return '/inicio';
    return `/${this.usuario.rol}/informacion-plataforma`;
  }

  get configuracionRoute(): string {
    if (!this.usuario?.rol) return '/inicio';
    return `/${this.usuario.rol}/configuracion`;
  }

  // Foto
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
        // Se aplicó el recorte
        this.fotoFile = result.file;
        this.fotoPreview = result.base64;
        this.fotoChanged = true;
        this.eliminarPending = false;

        // Subir la foto inmediatamente
        try {
          this.subirFotoInmediata();
        } catch (err) {
          console.error('Error al iniciar subida inmediata', err);
        }
      }
      // Si result es null, el usuario canceló
    } catch (err) {
      console.error('Error al abrir el cropper', err);
      this.alertService.error('Error', 'No se pudo procesar la imagen. Intenta de nuevo.');
    }

    // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
    event.target.value = '';
  }

  async eliminarFoto() {
    if (!this.usuario) return;

    const confirmado = await this.alertService.confirm(
      '¿Eliminar foto?',
      '¿Deseas eliminar la foto? Se eliminará inmediatamente.',
      'Sí, eliminar',
      'Cancelar',
      'warning'
    );

    if (!confirmado) return;

    // Llamada inmediata para eliminar la foto
    if (!this.usuario) return;
    this.isLoading = true;
    this.actualizandoFoto = true; // Evitar resetear el formulario
    const form = new FormData();
    form.append('userId', String(this.usuario.id));
    form.append('eliminar_foto', 'true');

    this.registroService.actualizarPerfilInicial(form as any).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.fotoFile = null;
        this.fotoPreview = null;
        this.fotoChanged = false;
        this.eliminarPending = false;

        const base = this.usuario || this.authService.obtenerUsuario() || ({} as Usuario);
        let fotoFinal: string | null | undefined = null;
        if (res && res.datos && Object.prototype.hasOwnProperty.call(res.datos, 'foto_perfil')) {
          fotoFinal = res.datos.foto_perfil; // may be null when deleted
        }

        const nuevo = {
          ...base,
          foto_perfil: fotoFinal,
        } as Usuario;

        // Actualizar usando el servicio de autenticación (sin recargar página)
        this.authService.actualizarUsuario({ foto_perfil: fotoFinal as string | undefined });
        this.usuario = nuevo;
        this.actualizandoFoto = false; // Restablecer flag después de la actualización
        this.alertService.toastSuccess('Foto eliminada correctamente');
      },
      error: (err) => {
        console.error('Error eliminando foto', err);
        this.isLoading = false;
        this.actualizandoFoto = false; // Restablecer flag en caso de error
        this.alertService.error('Error', 'No se pudo eliminar la foto. Intenta de nuevo.');
      },
    });
  }

  subirFotoInmediata() {
    if (!this.usuario || !this.fotoFile) return;
    this.isLoading = true;
    this.actualizandoFoto = true; // Evitar resetear el formulario

    const form = new FormData();
    form.append('userId', String(this.usuario.id));
    form.append('foto', this.fotoFile, this.fotoFile.name);

    this.registroService.actualizarPerfilInicial(form as any).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.fotoChanged = false;
        this.eliminarPending = false;

        const base = this.usuario || this.authService.obtenerUsuario() || ({} as Usuario);
        let fotoFinal: string | null | undefined = base.foto_perfil;
        if (res && res.datos && Object.prototype.hasOwnProperty.call(res.datos, 'foto_perfil')) {
          fotoFinal = res.datos.foto_perfil;
        } else if (this.fotoPreview) {
          fotoFinal = this.fotoPreview;
        }

        const nuevo = {
          ...base,
          foto_perfil: fotoFinal,
        } as Usuario;

        // Actualizar usando el servicio de autenticación (sin recargar página)
        this.authService.actualizarUsuario({ foto_perfil: fotoFinal as string | undefined });
        this.usuario = nuevo;
        this.actualizandoFoto = false; // Restablecer flag después de la actualización
        this.alertService.toastSuccess('Foto actualizada correctamente');
      },
      error: (err) => {
        console.error('Error subiendo foto', err);
        this.isLoading = false;
        this.actualizandoFoto = false; // Restablecer flag en caso de error
        this.alertService.error('Error', 'No se pudo subir la foto. Intenta de nuevo.');
      },
    });
  }

  // Nombre/apellido validations (template-driven compatible con datos-basicos)
  // Configuración de validación (igual que datos-basicos)
  readonly NOMBRE_MIN_LENGTH = VALIDATION_CONFIG.nombre.minLength;
  readonly NOMBRE_MAX_LENGTH = VALIDATION_CONFIG.nombre.maxLength;
  readonly APELLIDO_MIN_LENGTH = VALIDATION_CONFIG.apellido.minLength;
  readonly APELLIDO_MAX_LENGTH = VALIDATION_CONFIG.apellido.maxLength;
  readonly MIN_PALABRA_LENGTH = VALIDATION_CONFIG.nombre.minPalabraLength;

  // Regex para solo letras (igual que datos-basicos)
  private readonly soloLetrasRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü'\-\s]+$/;

  /**
   * Verifica si cada palabra tiene al menos el mínimo de caracteres requerido
   */
  private verificarPalabrasMinimas(valor: string): boolean {
    if (!valor) return true;
    const palabras = valor.trim().split(/\s+/);
    return palabras.every((palabra: string) => palabra.length >= this.MIN_PALABRA_LENGTH);
  }

  /**
   * Validación completa del nombre (igual que datos-basicos)
   */
  nombreValidoLocal(): boolean {
    if (!this.nombre) return false;
    const nombreTrim = this.nombre.trim();
    return (
      nombreTrim.length >= this.NOMBRE_MIN_LENGTH &&
      nombreTrim.length <= this.NOMBRE_MAX_LENGTH &&
      this.soloLetrasRegex.test(nombreTrim) &&
      this.verificarPalabrasMinimas(nombreTrim)
    );
  }

  /**
   * Validación completa del apellido (igual que datos-basicos)
   */
  apellidoValidoLocal(): boolean {
    if (!this.apellido) return false;
    const apellidoTrim = this.apellido.trim();
    return (
      apellidoTrim.length >= this.APELLIDO_MIN_LENGTH &&
      apellidoTrim.length <= this.APELLIDO_MAX_LENGTH &&
      this.soloLetrasRegex.test(apellidoTrim) &&
      this.verificarPalabrasMinimas(apellidoTrim)
    );
  }

  /**
   * Verifica si el nombre tiene error de palabras mínimas
   */
  nombreTienePalabrasCortas(): boolean {
    if (!this.nombre) return false;
    return !this.verificarPalabrasMinimas(this.nombre.trim());
  }

  /**
   * Verifica si el apellido tiene error de palabras mínimas
   */
  apellidoTienePalabrasCortas(): boolean {
    if (!this.apellido) return false;
    return !this.verificarPalabrasMinimas(this.apellido.trim());
  }

  // Backwards-compatible aliases used by template edits
  nombreValido(): boolean {
    return this.nombreValidoLocal();
  }

  apellidoValido(): boolean {
    return this.apellidoValidoLocal();
  }

  validarNombreApellido(): boolean {
    return this.nombreValidoLocal() && this.apellidoValidoLocal();
  }

  /**
   * Marca el género como tocado para mostrar validaciones
   */
  marcarGeneroTocado(): void {
    this.generoTocado = true;
  }

  async actualizarDatos() {
    if (!this.usuario) return;
    if (!this.validarNombreApellido()) {
      this.alertService.warning('Campos inválidos', 'Por favor corrige los campos requeridos.');
      return;
    }

    const confirmado = await this.alertService.confirm(
      '¿Actualizar datos?',
      '¿Confirmas que deseas actualizar tus datos?',
      'Sí, actualizar',
      'Cancelar',
      'question'
    );

    if (!confirmado) return;

    this.isLoading = true;

    setTimeout(() => {
      const form = new FormData();
      form.append('userId', String(this.usuario!.id));
      if (this.fotoFile && this.fotoChanged) form.append('foto', this.fotoFile, this.fotoFile.name);
      if (this.nombre) form.append('nombres', this.nombre);
      if (this.apellido) form.append('apellidos', this.apellido);
      if (this.genero) form.append('genero', this.genero);

      if (this.fechaNacimiento.dia && this.fechaNacimiento.mes && this.fechaNacimiento.anio) {
        const fecha = `${this.fechaNacimiento.anio}-${String(this.fechaNacimiento.mes).padStart(2, '0')}-${String(this.fechaNacimiento.dia).padStart(2, '0')}`;
        form.append('fecha_nacimiento', fecha);
      }

      if (this.eliminarPending) form.append('eliminar_foto', 'true');

      this.registroService.actualizarPerfilInicial(form as any).subscribe({
        next: (res) => {
          this.isLoading = false;
          const base = this.usuario || this.authService.obtenerUsuario() || ({} as Usuario);
          let fotoFinal: string | null | undefined = base.foto_perfil;
          if (res && res.datos && Object.prototype.hasOwnProperty.call(res.datos, 'foto_perfil')) {
            fotoFinal = res.datos.foto_perfil; // may be null when deleted
          } else if (this.fotoPreview) {
            fotoFinal = this.fotoPreview;
          }

          const datosActualizados: Partial<Usuario> = {
            nombres: this.nombre || base.nombres,
            apellidos: this.apellido || base.apellidos,
            genero: (this.genero || base.genero) as Usuario['genero'],
            fecha_nacimiento: (form.get('fecha_nacimiento') as string) || base.fecha_nacimiento,
            foto_perfil: fotoFinal as string | undefined,
          };

          // Actualizar usando el servicio de autenticación (sin recargar página)
          this.authService.actualizarUsuario(datosActualizados);
          this.usuario = { ...base, ...datosActualizados } as Usuario;
          this.fotoChanged = false;
          this.eliminarPending = false;
          this.alertService.toastSuccess('Configuración actualizada exitosamente');
        },
        error: (err) => {
          console.error('Error actualizando perfil', err);
          this.isLoading = false;
          this.alertService.error('Error', 'Error al actualizar datos. Intenta de nuevo.');
        },
      });
    }, 300);
  }

  // Password UI/validation copied from datos-basicos
  toggleContrasena() {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  toggleContrasenaActual() {
    this.mostrarContrasenaActual = !this.mostrarContrasenaActual;
  }

  toggleConfirmarContrasena() {
    this.mostrarConfirmarContrasena = !this.mostrarConfirmarContrasena;
  }

  verificarIndicaciones() {
    const val = this.contrasenaNueva || '';
    const indicadores = verificarIndicadoresPassword(val);
    this.indicaciones.longitud = indicadores.longitud;
    this.indicaciones.numero = indicadores.numero;
    this.indicaciones.mayuscula = indicadores.mayuscula && indicadores.minuscula;
    this.indicaciones.simbolo = indicadores.simbolo;
  }

  async cambiarContrasena() {
    if (!this.contrasenaActual || !this.contrasenaNueva || !this.contrasenaConfirmar) {
      this.alertService.warning('Campos incompletos', 'Completa las tres casillas de contraseña.');
      return;
    }
    if (this.contrasenaNueva !== this.contrasenaConfirmar) {
      this.alertService.warning('Contraseñas no coinciden', 'Las nuevas contraseñas no coinciden.');
      return;
    }
    this.verificarIndicaciones();
    if (!this.indicaciones.longitud || !this.indicaciones.numero || !this.indicaciones.mayuscula) {
      this.alertService.warning('Contraseña débil', 'La nueva contraseña no cumple los requisitos.');
      return;
    }

    const confirmado = await this.alertService.confirm(
      '¿Cambiar contraseña?',
      '¿Confirmas que deseas cambiar tu contraseña?',
      'Sí, cambiar',
      'Cancelar',
      'question'
    );

    if (!confirmado) return;

    this.isLoading = true;

    setTimeout(() => {
      const token = localStorage.getItem('access_token');
      fetch(`${environment.apiBaseUrl}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          current_password: this.contrasenaActual,
          new_password: this.contrasenaNueva,
        }),
      })
        .then(async (r) => {
          this.isLoading = false;
          const json = await r.json();
          if (!r.ok) {
            this.alertService.error('Error', json.error || 'Error al cambiar la contraseña.');
            return;
          }
          this.alertService.toastSuccess('Contraseña actualizada exitosamente');
          this.contrasenaActual = this.contrasenaNueva = this.contrasenaConfirmar = '';
          // Reset form state so inputs stop showing touched/invalid styles
          try {
            this.passwordForm?.resetForm();
          } catch (e) {
            // ignore if viewchild not available
          }
          // Reset indicators
          this.indicaciones = { longitud: false, numero: false, mayuscula: false, simbolo: false };
        })
        .catch((err) => {
          console.error('Error cambiar contraseña', err);
          this.isLoading = false;
          this.alertService.error('Error', 'Error al cambiar la contraseña.');
        });
    }, 300);
  }
}
