import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderPlataforma } from '../headers/header-plataforma/header-plataforma';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService, Usuario } from '@app/core/auth/service/auth';
import { AlertService } from '@app/services/alert/alert.service';
import { Subject, takeUntil, filter } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, HeaderPlataforma, MatTooltipModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
})
export class Sidebar implements OnInit, OnDestroy {
  currentTheme: 'light' | 'dark' = 'light';
  isDrawerClosed = false;
  usuario: Usuario | null = null;
  private destroy$ = new Subject<void>();
  private readonly SIDEBAR_STATE_KEY = 'sidebarState';
  private readonly SMALL_SCREEN_BREAKPOINT = 1024; // lg breakpoint in Tailwind

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertService: AlertService
  ) {
    // Inicializar usuario inmediatamente desde localStorage
    this.usuario = this.authService.obtenerUsuario();
  }

  ngOnInit(): void {
    // Suscribirse a cambios del usuario y actualizar tema cuando cambie
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.usuario = user;
      // Actualizar tema cuando cambie la preferencia del usuario (ej: desde otra pestaña)
      if (user?.preferencia_tema) {
        this.actualizarTemaDesdePreferencia(user.preferencia_tema);
      }
    });

    // Configurar tema basado en la preferencia del usuario guardada en BD
    this.cargarTemaUsuario();

    // Restaurar estado del sidebar desde localStorage
    this.restaurarEstadoSidebar();

    // Escuchar cambios de navegación para cerrar sidebar en pantalla pequeña
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.cerrarSidebarEnPantallasPequenas();
      });

    this.checkDrawerState();
  }

  /**
   * Carga el tema basado en la preferencia del usuario guardada en la base de datos
   */
  private cargarTemaUsuario(): void {
    const usuario = this.authService.obtenerUsuario();
    if (usuario?.preferencia_tema) {
      this.actualizarTemaDesdePreferencia(usuario.preferencia_tema);
    } else {
      // Si no hay preferencia guardada, usar la del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme = prefersDark ? 'dark' : 'light';
      this.applyTheme(this.currentTheme);
    }
  }

  /**
   * Actualiza el tema basado en la preferencia del usuario
   */
  private actualizarTemaDesdePreferencia(preferencia: string): void {
    let nuevoTema: 'light' | 'dark';
    if (preferencia === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      nuevoTema = prefersDark ? 'dark' : 'light';
    } else {
      nuevoTema = preferencia === 'oscuro' ? 'dark' : 'light';
    }

    // Solo aplicar si cambió el tema
    if (this.currentTheme !== nuevoTema) {
      this.currentTheme = nuevoTema;
      this.applyTheme(this.currentTheme);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleTheme(): void {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.currentTheme);

    // Guardar en la base de datos
    const temaParaGuardar: 'claro' | 'oscuro' = this.currentTheme === 'dark' ? 'oscuro' : 'claro';
    this.authService.actualizarTemaServidor(temaParaGuardar).subscribe({
      error: (error) => {
        console.error('Error al guardar preferencia de tema:', error);
        // Opcionalmente, podrías mostrar un mensaje al usuario
      }
    });
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    // Agregar clase para deshabilitar transiciones durante el cambio de tema
    document.documentElement.classList.add('theme-transitioning');

    document.documentElement.setAttribute('data-theme', theme);

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Remover clase después de que el cambio de tema se haya aplicado
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('theme-transitioning');
      });
    });
  }

  toggleDrawer(): void {
    const drawer = document.getElementById('my-drawer') as HTMLInputElement;
    if (drawer) {
      drawer.click();
      setTimeout(() => {
        this.checkDrawerState();
        this.guardarEstadoSidebar();
      }, 0);
    }
  }

  checkDrawerState(): void {
    const drawer = document.getElementById('my-drawer') as HTMLInputElement;
    this.isDrawerClosed = !drawer?.checked;
  }

  /**
   * Guarda el estado del sidebar en localStorage
   */
  private guardarEstadoSidebar(): void {
    const drawer = document.getElementById('my-drawer') as HTMLInputElement;
    if (drawer) {
      localStorage.setItem(this.SIDEBAR_STATE_KEY, drawer.checked ? 'open' : 'closed');
    }
  }

  /**
   * Restaura el estado del sidebar desde localStorage
   * En pantallas pequeñas siempre inicia cerrado
   */
  private restaurarEstadoSidebar(): void {
    const drawer = document.getElementById('my-drawer') as HTMLInputElement;
    if (!drawer) return;

    // En pantallas pequeñas siempre cerrar el sidebar
    if (window.innerWidth < this.SMALL_SCREEN_BREAKPOINT) {
      drawer.checked = false;
      this.checkDrawerState();
      return;
    }

    // En pantallas grandes, restaurar el estado guardado
    const estadoGuardado = localStorage.getItem(this.SIDEBAR_STATE_KEY);
    if (estadoGuardado) {
      const debeEstarAbierto = estadoGuardado === 'open';
      if (drawer.checked !== debeEstarAbierto) {
        drawer.checked = debeEstarAbierto;
        this.checkDrawerState();
      }
    }
  }

  /**
   * Cierra el sidebar automáticamente en pantallas pequeñas
   */
  private cerrarSidebarEnPantallasPequenas(): void {
    if (window.innerWidth < this.SMALL_SCREEN_BREAKPOINT) {
      const drawer = document.getElementById('my-drawer') as HTMLInputElement;
      if (drawer && drawer.checked) {
        drawer.checked = false;
        this.checkDrawerState();
      }
    }
  }

  /**
   * Maneja el cambio del checkbox del drawer (llamado desde el template)
   */
  onDrawerChange(): void {
    this.checkDrawerState();
    this.guardarEstadoSidebar();
  }

  shouldShowTooltip(): boolean {
    return this.isDrawerClosed;
  }

  async cerrarSesion(): Promise<void> {
    const confirmado = await this.alertService.confirm(
      '¿Cerrar sesión?',
      '¿Estás seguro de que deseas cerrar sesión?',
      'Sí, cerrar sesión',
      'Cancelar',
      'question'
    );

    if (confirmado) {
      // Limpiar el estado del sidebar antes de cerrar sesión
      localStorage.removeItem(this.SIDEBAR_STATE_KEY);

      this.authService.logout().subscribe({
        next: () => {
          this.alertService.toastSuccess('Sesión cerrada correctamente');
        },
        error: (error) => {
          console.error('Error al cerrar sesión:', error);
        },
      });
    }
  }

  // Método para obtener el nombre completo
  get nombreCompleto(): string {
    if (!this.usuario) return 'Usuario';
    return `${this.usuario.nombres} ${this.usuario.apellidos}`;
  }

  // Método para obtener el badge del rol
  get rolBadge(): { text: string; color: string } {
    if (!this.usuario || !this.usuario.rol) {
      return { text: 'Usuario', color: 'bg-gray-500' };
    }

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

  // Método para verificar si debe mostrar un item del menú
  shouldShowMenuItem(requiredRoles?: string[]): boolean {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    if (!this.usuario || !this.usuario.rol) return false;
    return requiredRoles.includes(this.usuario.rol);
  }

  // Método para obtener la ruta de políticas
  get politicasRoute(): string {
    if (!this.usuario?.rol) {
      return '/politicas-privacidad';
    }
    return `/${this.usuario.rol}/politicas-plataforma`;
  }

  // Método para obtener la ruta de información
  get informacionRoute(): string {
    if (!this.usuario?.rol) {
      return '/inicio';
    }
    return `/${this.usuario.rol}/informacion-plataforma`;
  }

  // Método para obtener la ruta de inicio
  get inicioRoute(): string {
    if (!this.usuario?.rol) {
      return '/inicio';
    }
    return `/${this.usuario.rol}/inicio`;
  }

  // Método para obtener la ruta de configuracion
  get configuracionRoute(): string {
    if (!this.usuario?.rol) {
      return '/inicio';
    }
    return `/${this.usuario.rol}/configuracion`;
  }
}
