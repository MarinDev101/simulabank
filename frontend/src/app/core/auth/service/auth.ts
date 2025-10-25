import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Los services se encargan de la lógica de negocio y comunicación con el backend

  private apiUrl = 'http://localhost:3000/api/auth'; // Endpoint del backend. URL base de la API
  private claveToken = 'token'; // clave para almacenar el token en localStorage
  private claveUsuario = 'usuario'; // clave para almacenar el usuario en localStorage

  constructor(private http: HttpClient) {}

  iniciarSesion(correo: string, clave: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email: correo, password: clave }).pipe(
      tap((respuesta) => {
        if (respuesta.token) {
          localStorage.setItem(this.claveToken, respuesta.token);
          localStorage.setItem(this.claveUsuario, JSON.stringify(respuesta.usuario));
        }
      })
    );
  }

  cerrarSesion() {
    localStorage.removeItem(this.claveToken);
    localStorage.removeItem(this.claveUsuario);
  }

  obtenerUsuario() {
    return JSON.parse(localStorage.getItem(this.claveUsuario) || 'null');
  }

  estaAutenticado(): boolean {
    return !!localStorage.getItem(this.claveToken);
  }

  obtenerRol(): string {
    const usuario = this.obtenerUsuario();
    return usuario?.rol || '';
  }
}
