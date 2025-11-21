import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

export interface InicioRegistroRequest {
  correo: string;
  nombres: string;
  apellidos: string;
  contrasena: string;
}

export interface InicioRegistroResponse {
  success: boolean;
  message: string;
  correo: string;
}

export interface VerificarCodigoRequest {
  correo: string;
  codigo: string;
}

export interface VerificarCodigoResponse {
  success: boolean;
  message: string;
  token: string;
  refreshToken: string;
  user: {
    id: number;
    correo: string;
    nombres: string;
    apellidos: string;
    rol: string;
  };
}

export interface ActualizarPerfilRequest {
  userId: number;
  foto_perfil?: string;
  fecha_nacimiento?: string;
  genero?: string;
}

export interface ActualizarPerfilResponse {
  success: boolean;
  message: string;
  datos?: any;
}

@Injectable({
  providedIn: 'root',
})
export class RegistroService {
  private apiUrl = `${environment.apiBaseUrl}/auth`;

  constructor(private http: HttpClient) {}

  iniciarRegistro(datos: InicioRegistroRequest): Observable<InicioRegistroResponse> {
    return this.http.post<InicioRegistroResponse>(`${this.apiUrl}/registrar-inicio`, datos);
  }

  verificarCodigo(datos: VerificarCodigoRequest): Observable<VerificarCodigoResponse> {
    return this.http.post<VerificarCodigoResponse>(`${this.apiUrl}/verificar-codigo`, datos);
  }

  actualizarPerfilInicial(datos: ActualizarPerfilRequest): Observable<ActualizarPerfilResponse> {
    return this.http.put<ActualizarPerfilResponse>(`${this.apiUrl}/perfil-inicial`, datos);
  }

  reenviarCodigo(datos: {
    correo: string;
    nombres: string;
    apellidos: string;
    contrasena: string;
  }): Observable<InicioRegistroResponse> {
    return this.http.post<InicioRegistroResponse>(`${this.apiUrl}/registrar-inicio`, datos);
  }
}
