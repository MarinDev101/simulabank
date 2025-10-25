import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReturnButton } from '@app/components/return-button/return-button';
import { Router } from '@angular/router';
import { AuthService } from '@app/core/auth/service/auth';

@Component({
  selector: 'app-iniciar-sesion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReturnButton],
  templateUrl: './iniciar-sesion.html',
})
export class IniciarSesion {
  correo = '';
  clave = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // Funcion encargada de iniciar sesion
  iniciarSesion() {
    // Se llama al servicio para utilziar su funcionalidad (Ctrl + click en iniciarSesion)
    this.authService.iniciarSesion(this.correo, this.clave).subscribe({
      // El next sirve para manejar las respuestas exitosas de la funcion
      next: () => {
        // Se obtiene el usuario logueado
        const usuario = this.authService.obtenerUsuario();

        // Aquí decides a dónde va el usuario
        if (usuario.rol === 'Administrador') {
          this.router.navigate(['/usuarios']); // panel admin
        } else {
          this.router.navigate(['/inicio']); // página normal
        }
      },
      error: (err) => {
        alert('Credenciales incorrectas');
      },
    });
  }
}
