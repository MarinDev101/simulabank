import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService, Usuario } from '@app/core/auth/service/auth';
import { RegistroService } from '@app/core/auth/service/registro';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion.html',
})
export class Configuracion implements OnInit {
  // Tab activo
  activeTab: string = 'tab1';

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

  // Nombre / apellido (editable)
  nombre: string = '';
  apellido: string = '';

  // Foto
  fotoFile: File | null = null;
  fotoPreview: string | null = null;
  eliminarPending: boolean = false; // mark delete locally until update
  fotoChanged: boolean = false; // mark new photo selected

  isLoading = false;
  errorMessage = '';
  successMessage = '';

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
    private registroService: RegistroService
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

    // Rellenar días y años
    this.dias = Array.from({ length: 31 }, (_, i) => i + 1);
    const anioActual = new Date().getFullYear();
    this.anios = Array.from({ length: anioActual - 1899 }, (_, i) => anioActual - i);
  }

  ngOnInit(): void {}

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
  onFotoSeleccionada(event: any) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    this.fotoFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.fotoPreview = e.target.result;
      this.fotoChanged = true;
      this.eliminarPending = false; // if new photo selected, cancel delete
      // Subir la foto inmediatamente al seleccionarla
      try {
        this.subirFotoInmediata();
      } catch (err) {
        console.error('Error al iniciar subida inmediata', err);
      }
    };
    reader.readAsDataURL(file);
  }
  eliminarFoto() {
    if (!this.usuario) return;
    if (!confirm('¿Deseas eliminar la foto? Se eliminará inmediatamente.')) return;
    // Llamada inmediata para eliminar la foto
    if (!this.usuario) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
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
        try {
          localStorage.setItem('user_data', JSON.stringify(nuevo));
        } catch (e) {
          console.warn('No se pudo guardar user_data en localStorage', e);
        }
        this.usuario = nuevo;
        this.successMessage = 'Foto eliminada correctamente.';
        setTimeout(() => {
          try {
            window.location.reload();
          } catch (e) {
            location.reload();
          }
        }, 600);
      },
      error: (err) => {
        console.error('Error eliminando foto', err);
        this.isLoading = false;
        this.errorMessage = 'No se pudo eliminar la foto. Intenta de nuevo.';
      },
    });
  }

  subirFotoInmediata() {
    if (!this.usuario || !this.fotoFile) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

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
        try {
          localStorage.setItem('user_data', JSON.stringify(nuevo));
        } catch (e) {
          console.warn('No se pudo guardar user_data en localStorage', e);
        }
        this.usuario = nuevo;
        this.successMessage = 'Foto actualizada correctamente.';
        setTimeout(() => {
          try {
            window.location.reload();
          } catch (e) {
            location.reload();
          }
        }, 700);
      },
      error: (err) => {
        console.error('Error subiendo foto', err);
        this.isLoading = false;
        this.errorMessage = 'No se pudo subir la foto. Intenta de nuevo.';
      },
    });
  }

  // Nombre/apellido validations (template-driven compatible with mensajes similares a datos-basicos)
  nombreValidoLocal(): boolean {
    return !!(
      this.nombre &&
      this.nombre.trim().length >= 2 &&
      /^[A-Za-zÀ-ÿ\s]+$/.test(this.nombre)
    );
  }

  apellidoValidoLocal(): boolean {
    return !!(
      this.apellido &&
      this.apellido.trim().length >= 2 &&
      /^[A-Za-zÀ-ÿ\s]+$/.test(this.apellido)
    );
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

  actualizarDatos() {
    if (!this.usuario) return;
    if (!this.validarNombreApellido()) {
      this.errorMessage = 'Por favor corrige los campos requeridos.';
      return;
    }
    if (!confirm('¿Confirmas que deseas actualizar tus datos?')) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

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

          const nuevo = {
            ...base,
            nombres: this.nombre || base.nombres,
            apellidos: this.apellido || base.apellidos,
            genero: this.genero || base.genero,
            fecha_nacimiento: (form.get('fecha_nacimiento') as string) || base.fecha_nacimiento,
            foto_perfil: fotoFinal,
          } as Usuario;
          localStorage.setItem('user_data', JSON.stringify(nuevo));
          this.usuario = nuevo;
          this.fotoChanged = false;
          this.eliminarPending = false;
          this.successMessage = 'Configuración exitosa.';
          // Persisted — reload page so sidebar and other components read updated localStorage
          setTimeout(() => {
            try {
              window.location.reload();
            } catch (e) {
              // fallback
              location.reload();
            }
          }, 700);
        },
        error: (err) => {
          console.error('Error actualizando perfil', err);
          this.isLoading = false;
          this.errorMessage = 'Error al actualizar datos. Intenta de nuevo.';
        },
      });
    }, 3000);
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
    this.indicaciones.longitud = val.length >= 8;
    this.indicaciones.numero = /\d/.test(val);
    this.indicaciones.mayuscula = /[A-Z]/.test(val) && /[a-z]/.test(val);
    this.indicaciones.simbolo = /[@$!%*?&]/.test(val);
  }

  cambiarContrasena() {
    if (!this.contrasenaActual || !this.contrasenaNueva || !this.contrasenaConfirmar) {
      this.errorMessage = 'Completa las tres casillas de contraseña.';
      return;
    }
    if (this.contrasenaNueva !== this.contrasenaConfirmar) {
      this.errorMessage = 'Las nuevas contraseñas no coinciden.';
      return;
    }
    this.verificarIndicaciones();
    if (!this.indicaciones.longitud || !this.indicaciones.numero || !this.indicaciones.mayuscula) {
      this.errorMessage = 'La nueva contraseña no cumple los requisitos.';
      return;
    }
    if (!confirm('¿Confirmas que deseas cambiar tu contraseña?')) return;

    this.isLoading = true;
    this.errorMessage = '';

    setTimeout(() => {
      const token = localStorage.getItem('access_token');
      fetch('http://localhost:3000/api/auth/change-password', {
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
            this.errorMessage = json.error || 'Error al cambiar la contraseña.';
            return;
          }
          this.successMessage = 'Contraseña actualizada exitosamente.';
          this.contrasenaActual = this.contrasenaNueva = this.contrasenaConfirmar = '';
          // Reset form state so inputs stop showing touched/invalid styles
          try {
            this.passwordForm?.resetForm();
          } catch (e) {
            // ignore if viewchild not available
          }
          // Reset indicators
          this.indicaciones = { longitud: false, numero: false, mayuscula: false, simbolo: false };
          setTimeout(() => (this.successMessage = ''), 4000);
        })
        .catch((err) => {
          console.error('Error cambiar contraseña', err);
          this.isLoading = false;
          this.errorMessage = 'Error al cambiar la contraseña.';
        });
    }, 3000);
  }
}
