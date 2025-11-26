import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

export interface SolicitudRecuperacionRequest {
  correo: string;
}

export interface SolicitudRecuperacionResponse {
  success: boolean;
  message: string;
  correo: string;
}

export interface VerificarCodigoRecuperacionRequest {
  correo: string;
  codigo: string;
}

export interface VerificarCodigoRecuperacionResponse {
  success: boolean;
  message: string;
  token_temporal: string;
}

export interface RestablecerContrasenaRequest {
  token_temporal: string;
  nueva_contrasena: string;
}

export interface RestablecerContrasenaResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class RecuperacionService {
  private apiUrl = `${environment.apiBaseUrl}/auth`;

  constructor(private http: HttpClient) {}

  solicitarRecuperacion(
    datos: SolicitudRecuperacionRequest
  ): Observable<SolicitudRecuperacionResponse> {
    return this.http.post<SolicitudRecuperacionResponse>(
      `${this.apiUrl}/solicitar-recuperacion`,
      datos
    );
  }

  verificarCodigoRecuperacion(
    datos: VerificarCodigoRecuperacionRequest
  ): Observable<VerificarCodigoRecuperacionResponse> {
    return this.http.post<VerificarCodigoRecuperacionResponse>(
      `${this.apiUrl}/verificar-codigo-recuperacion`,
      datos
    );
  }

  restablecerContrasena(
    datos: RestablecerContrasenaRequest
  ): Observable<RestablecerContrasenaResponse> {
    return this.http.post<RestablecerContrasenaResponse>(
      `${this.apiUrl}/restablecer-contrasena`,
      datos
    );
  }

  reenviarCodigoRecuperacion(correo: string): Observable<SolicitudRecuperacionResponse> {
    return this.http.post<SolicitudRecuperacionResponse>(`${this.apiUrl}/solicitar-recuperacion`, {
      correo,
    });
  }
}
