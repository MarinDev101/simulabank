import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderPlataforma } from '../headers/header-plataforma/header-plataforma';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, Router } from '@angular/router';
import { AuthService, Usuario } from '@app/core/auth/service/auth';
import { AlertService } from '@app/services/alert/alert.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, HeaderPlataforma, MatTooltipModule, RouterLink],
  templateUrl: './sidebar.html',
})
export class Sidebar implements OnInit, OnDestroy {
  currentTheme: 'light' | 'dark' = 'light';
  isDrawerClosed = false;
  usuario: Usuario | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertService: AlertService
  ) {
    // Inicializar usuario inmediatamente desde localStorage
    this.usuario = this.authService.obtenerUsuario();
  }

  ngOnInit(): void {
    // Suscribirse a cambios del usuario
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.usuario = user;
    });

    // Configurar tema
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      this.currentTheme = savedTheme;
      this.applyTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme = prefersDark ? 'dark' : 'light';
      this.applyTheme(this.currentTheme);
    }

    this.checkDrawerState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleTheme(): void {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.currentTheme);
    localStorage.setItem('theme', this.currentTheme);
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    document.documentElement.setAttribute('data-theme', theme);

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  toggleDrawer(): void {
    const drawer = document.getElementById('my-drawer') as HTMLInputElement;
    if (drawer) {
      drawer.click();
      setTimeout(() => this.checkDrawerState(), 0);
    }
  }

  checkDrawerState(): void {
    const drawer = document.getElementById('my-drawer') as HTMLInputElement;
    this.isDrawerClosed = !drawer?.checked;
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
      this.authService.logout().subscribe({
        next: () => {
          this.alertService.toastSuccess('Sesión cerrada correctamente');
          this.router.navigate(['/iniciar-sesion']);
        },
        error: (error) => {
          console.error('Error al cerrar sesión:', error);
          // Aunque falle, redirigir al login
          this.router.navigate(['/iniciar-sesion']);
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
