import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Logro {
  id_logro: number;
  nombre: string;
  imagen: string;
  descripcion: string;
  condicion_tipo: string;
  fecha_desbloqueo?: string;
}

export interface InfoInicioAprendiz {
  totalSimulacionesCompletadas: number;
  totalLogrosCompletados: number;
}

@Injectable({
  providedIn: 'root',
})
export class Estadisticas {
  private readonly baseUrl = `${environment.apiBaseUrl}/estadisticas`;

  constructor(private http: HttpClient) {}

  obtenerLogrosPlataforma(): Observable<Logro[]> {
    return this.http
      .get<{ ok: boolean; logros: Logro[] }>(`${this.baseUrl}/listarLogros`)
      .pipe(map((resp) => resp.logros));
  }

  obtenerLogrosAprendiz(): Observable<Logro[]> {
    return this.http
      .get<{ ok: boolean; logros: Logro[] }>(`${this.baseUrl}/listarLogrosAprendiz`)
      .pipe(map((resp) => resp.logros));
  }

  obtenerInfoInicioAprendiz(): Observable<InfoInicioAprendiz> {
    return this.http
      .get<{ ok: boolean; datos: InfoInicioAprendiz }>(`${this.baseUrl}/listarInformacionInicio`)
      .pipe(map((resp) => resp.datos));
  }
}
