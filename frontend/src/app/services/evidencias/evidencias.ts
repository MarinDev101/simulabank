import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Evidencia {
  id_simulacion: number;
  numero_evidencia: number;
  modo: string;
  tiempo_duracion_segundos: number;
  producto_nombre: string;
  carpeta_nombre: string | null;
  fecha_agregado: string;
  estado: 'visible' | 'archivada';
  peso_pdf_kb: number | null;
  nombreSugerido: string;
  id_carpeta_personal: number | null;
}

export interface ListarEvidenciasResponse {
  ok: boolean;
  evidencias: Evidencia[];
}

export interface VerEvidenciaResponse {
  ok: boolean;
  pdfBase64: string;
  nombreSugerido: string;
}

export interface MensajeResponse {
  ok: boolean;
  mensaje?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EvidenciasService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiBaseUrl}/evidencias`;

  /**
   * Obtiene los headers con el token JWT
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  /**
   * Lista todas las evidencias del usuario
   */
  listarEvidencias(): Observable<Evidencia[]> {
    return this.http
      .get<ListarEvidenciasResponse>(`${this.API_URL}/listar`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => {
          if (response.ok) {
            return response.evidencias;
          }
          throw new Error('Error al obtener evidencias');
        }),
        catchError((error) => {
          console.error('Error listando evidencias:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtiene el PDF de una evidencia en base64 para visualizar
   */
  verEvidencia(idSimulacion: number): Observable<VerEvidenciaResponse> {
    return this.http
      .get<VerEvidenciaResponse>(`${this.API_URL}/ver/${idSimulacion}`, {
        headers: this.getHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Error obteniendo evidencia:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Descarga el PDF de una evidencia
   */
  descargarEvidencia(idSimulacion: number, nombreArchivo: string): Observable<void> {
    return this.http
      .get(`${this.API_URL}/descargar/${idSimulacion}`, {
        headers: this.getHeaders(),
        responseType: 'blob',
      })
      .pipe(
        map((blob: Blob) => {
          // Crear URL temporal para el blob
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = nombreArchivo;
          link.click();
          window.URL.revokeObjectURL(url);
        }),
        catchError((error) => {
          console.error('Error descargando evidencia:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Archiva una evidencia
   */
  archivarEvidencia(idSimulacion: number): Observable<MensajeResponse> {
    return this.http
      .patch<MensajeResponse>(
        `${this.API_URL}/archivar`,
        { id_simulacion: idSimulacion },
        { headers: this.getHeaders() }
      )
      .pipe(
        catchError((error) => {
          console.error('Error archivando evidencia:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Desarchiva una evidencia
   */
  desarchivarEvidencia(idSimulacion: number): Observable<MensajeResponse> {
    return this.http
      .patch<MensajeResponse>(
        `${this.API_URL}/desarchivar`,
        { id_simulacion: idSimulacion },
        { headers: this.getHeaders() }
      )
      .pipe(
        catchError((error) => {
          console.error('Error desarchivando evidencia:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Elimina una evidencia
   */
  eliminarEvidencia(idSimulacion: number): Observable<MensajeResponse> {
    return this.http
      .delete<MensajeResponse>(`${this.API_URL}/eliminar/${idSimulacion}`, {
        headers: this.getHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Error eliminando evidencia:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Formatea la duración en segundos a formato legible
   */
  formatearDuracion(segundos: number): string {
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = segundos % 60;

    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  /**
   * Formatea el tamaño del archivo
   */
  formatearPeso(pesoKb: number | null): string {
    if (!pesoKb) return 'N/A';
    if (pesoKb < 1024) return `${pesoKb} KB`;
    return `${(pesoKb / 1024).toFixed(2)} MB`;
  }
}
