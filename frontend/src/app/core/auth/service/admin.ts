import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Usuario } from './auth';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiUrl = 'http://localhost:3000/api/admin';

  constructor(private http: HttpClient) {}

  // Obtener todos los aprendices
  obtenerTodosLosAprendices(): Observable<Usuario[]> {
    const token = this.getToken();
    return this.http
      .get<Usuario[]>(`${this.apiUrl}/aprendices`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .pipe(
        catchError((error) => {
          console.error('Error al obtener aprendices:', error);
          return throwError(() => error);
        })
      );
  }

  // Actualizar aprendiz
  actualizarAprendiz(aprendiz: Usuario): Observable<any> {
    const token = this.getToken();

    // Formatear fecha_nacimiento a YYYY-MM-DD
    let fechaNacimientoFormateada = null;
    if (aprendiz.fecha_nacimiento) {
      const fecha = new Date(aprendiz.fecha_nacimiento);
      fechaNacimientoFormateada = fecha.toISOString().split('T')[0];
      console.log('📅 Fecha formateada para MySQL:', fechaNacimientoFormateada);
    }

    // Crear objeto con datos formateados
    const datosActualizacion = {
      nombres: aprendiz.nombres,
      apellidos: aprendiz.apellidos,
      correo: aprendiz.correo,
      estado: aprendiz.estado,
      fecha_nacimiento: fechaNacimientoFormateada,
      genero: aprendiz.genero || null
    };

    console.log('Enviando datos actualizados:', datosActualizacion);

    return this.http
      .put(`${this.apiUrl}/aprendices/${aprendiz.id}`, datosActualizacion, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      })
      .pipe(
        catchError((error) => {
          console.error('Error al actualizar aprendiz:', error);
          return throwError(() => error);
        })
      );
  }

  // Inhabilitar aprendiz
  inhabilitarAprendiz(id: number): Observable<any> {
    const token = this.getToken();
    return this.http
      .patch(
        `${this.apiUrl}/aprendices/${id}/inhabilitar`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .pipe(
        catchError((error) => {
          console.error('Error al inhabilitar aprendiz:', error);
          return throwError(() => error);
        })
      );
  }

  // Habilitar aprendiz
  habilitarAprendiz(id: number): Observable<any> {
    const token = this.getToken();
    return this.http
      .patch(
        `${this.apiUrl}/aprendices/${id}/habilitar`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .pipe(
        catchError((error) => {
          console.error('Error al habilitar aprendiz:', error);
          return throwError(() => error);
        })
      );
  }

  // Obtener token del localStorage
  private getToken(): string | null {
    return localStorage.getItem('access_token');
  }
}
