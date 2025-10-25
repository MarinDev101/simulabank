import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderPlataforma } from '../headers/header-plataforma/header-plataforma';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '@app/core/auth/service/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, HeaderPlataforma, MatTooltipModule, RouterLink],
  templateUrl: './sidebar.html',
})
export class Sidebar implements OnInit {
  currentTheme: 'light' | 'dark' = 'light';
  isDrawerClosed = false;

  ngOnInit() {
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

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.currentTheme);
    localStorage.setItem('theme', this.currentTheme);
  }

  private applyTheme(theme: 'light' | 'dark') {
    // Mantener compatibilidad con el atributo data-theme (ya usado por el proyecto)
    document.documentElement.setAttribute('data-theme', theme);

    // AdemÃ¡s aÃ±adir/remover la clase .dark para que utilidades `dark:` de Tailwind funcionen
    // y para compatibilidad con otras librerÃ­as que esperan la clase.
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  toggleDrawer() {
    const drawer = document.getElementById('my-drawer') as HTMLInputElement;
    if (drawer) {
      drawer.click();
      setTimeout(() => this.checkDrawerState(), 0);
    }
  }

  checkDrawerState() {
    const drawer = document.getElementById('my-drawer') as HTMLInputElement;
    this.isDrawerClosed = !drawer?.checked;
  }

  // MÃ©todo para determinar si mostrar tooltip (solo cuando drawer estÃ¡ cerrado en pantallas grandes)
  shouldShowTooltip(): boolean {
    return this.isDrawerClosed;
  }

  //LOGIN==================
  usuario: any;

  // Se inyecta el servicio Authservices y Router
  constructor(
    private auth: AuthService,
    private router: Router
  ) {
    this.usuario = this.auth.obtenerUsuario(); // Obtiene el usuario guardado en localStorage
  }

  cerrarSesion() {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']); // Redirige al login al cerrar sesión
  }
}
