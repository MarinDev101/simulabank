import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, Usuario } from '@app/core/auth/service/auth';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-inicio-aprendiz',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './inicio-aprendiz.html',
})
export class InicioAprendiz {
  usuario: Usuario | null = null;

  constructor(
    private authService: AuthService,
  ) {
    // Inicializar usuario inmediatamente desde localStorage
    this.usuario = this.authService.obtenerUsuario();
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
}
