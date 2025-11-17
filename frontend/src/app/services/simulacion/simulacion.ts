import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { AuthService } from '@app/core/auth/service/auth';

// ============================================
// INTERFACES
// ============================================

export interface ConfiguracionSimulacion {
  producto:
    | 'cuenta_ahorros'
    | 'cuenta_corriente'
    | 'cdt_digital'
    | 'credito_libre_inversion'
    | 'credito_educativo_educaplus'
    | 'credito_rotativo_empresarial';
  modo: 'aprendizaje' | 'evaluativo';
  destino?: 'personal' | 'sala';
  interaccion?: 'automatico' | 'manual';
}

export interface EscenarioCliente {
  genero: string;
  imagen: string;
  nombre: string;
  edad: string;
  profesion: string;
  situacion_actual: string;
  motivacion: string;
  nivel_conocimiento: string;
  perfil_riesgo: string;
  objetivo: string;
  escenario_narrativo: string;
}

export interface EtapaConversacion {
  id_etapa_conversacion: number;
  id_producto_bancario: number;
  numero_orden: number;
  nombre: string;
  objetivo: string;
  quien_inicia: 'Asesor' | 'Cliente';
  validaciones: any;
  sugerencias_aprendizaje: any;
  instrucciones_ia_cliente: any;
}

export interface MensajeConversacion {
  indiceEtapa: number;
  totalEtapas: number;
  nombreEtapa: string;
  objetivoEtapa: string;
  emisor: 'Asesor' | 'Cliente';
  mensaje: string;
  receptor: 'Asesor' | 'Cliente';
}

export interface AnalisisAprendizaje {
  indiceEtapa: number;
  nombreEtapa: string;
  objetivoEtapa: string;
  recomendacionParaAsesor: string;
}

export interface AnalisisDesempeno {
  puntuacion_cualitativa: 'Excelente' | 'Muy bueno' | 'Bueno' | 'Regular' | 'Necesita mejorar';
  resumen_general: string;
}

export interface DatosSimulacion {
  id_simulacion: number;
  estado: 'en_proceso' | 'finalizada' | 'pausada';
  modo: 'aprendizaje' | 'evaluativo';
  destino_evidencia: 'personal' | 'sala';
  sonido_interaccion: 'automatico' | 'manual';
  producto_seleccion: string;
  etapa_actual_index: number;
  total_etapas: number;
  duracion_segundos: number;
  duracion_formato: string;
  fecha_inicio: string;
  fecha_ultima_interaccion: string;
  fecha_finalizacion: string | null;
}

export interface ProductoBancario {
  id_producto_bancario: number;
  nombre: string;
  categoria: 'Captacion' | 'Colocacion';
  concepto: string;
  caracteristicas: any;
  beneficios: any;
  requisitos: any;
}

export interface TipoCliente {
  id_tipo_cliente: number;
  tipo: string;
  actua: string;
  ejemplo: string;
}

export interface PerfilCliente {
  id_perfil_cliente: number;
  nombre: string;
  tipo_cliente: string;
  rango_cop: string;
  enfoque_atencion: string;
}

export interface EstadoSimulacion {
  ok: boolean;
  mensaje: string;
  simulacion: DatosSimulacion;
  producto: ProductoBancario;
  tipo_cliente: TipoCliente;
  perfil_cliente: PerfilCliente;
  escenario_cliente: EscenarioCliente;
  etapa_actual: EtapaConversacion;
  historial_conversacion: MensajeConversacion[];
  recomendaciones_aprendizaje: AnalisisAprendizaje[];
  aspectos_clave: any[];
  analisis_desempeno: AnalisisDesempeno | null;
}

export interface IniciarSimulacionResponse extends EstadoSimulacion {}

export interface EnviarMensajeResponse {
  ok: boolean;
  mensaje: string;
  id_simulacion: number;
  mensajes: {
    asesor: MensajeConversacion;
    cliente: MensajeConversacion;
  };
  historialActualizado: MensajeConversacion[];
  simulacion_finalizada: boolean;
  etapa_cambiada: boolean;
  nueva_etapa: EtapaConversacion | null;
  mensaje_nueva_etapa_cliente: MensajeConversacion | null;
  analisis_aprendizaje: AnalisisAprendizaje | null;
  analisis_desempeno: AnalisisDesempeno | null;
  duracion_segundos?: number;
  duracion_formato?: string;
  etapas_completadas?: number;
  total_etapas?: number;
  motivo_finalizacion?: string;
}

export interface FinalizarSimulacionResponse {
  ok: boolean;
  mensaje: string;
  simulacion: {
    id_simulacion: number;
    producto: string;
    modo: string;
    duracion_segundos: number;
    duracion_formato: string;
    etapas_completadas: number;
    total_etapas: number;
    simulacion_completada: boolean;
    total_mensajes: number;
    fecha_inicio: string;
    fecha_finalizacion: string;
  };
  historial: MensajeConversacion[];
}

// ============================================
// SERVICIO
// ============================================

@Injectable({
  providedIn: 'root',
})
export class SimulacionService {
  private apiUrl = 'http://localhost:3000/api/simulacion';
  private simulacionActivaKey = 'simulacion_activa';
  private estadoSimulacionKey = 'estado_simulacion';

  // Observable para el estado de la simulación activa
  private simulacionActivaSubject = new BehaviorSubject<boolean>(this.tieneSimulacionActiva());
  public simulacionActiva$ = this.simulacionActivaSubject.asObservable();

  // Observable para el estado completo de la simulación
  private estadoSimulacionSubject = new BehaviorSubject<EstadoSimulacion | null>(
    this.obtenerEstadoLocal()
  );
  public estadoSimulacion$ = this.estadoSimulacionSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Verificar si hay simulación activa al iniciar
    this.verificarSimulacionActiva();
  }

  // ============================================
  // MÉTODOS PRINCIPALES DE SIMULACIÓN
  // ============================================

  /**
   * Inicia una nueva simulación
   */
  iniciarSimulacion(configuracion: ConfiguracionSimulacion): Observable<IniciarSimulacionResponse> {
    const headers = this.getHeaders();

    return this.http
      .post<IniciarSimulacionResponse>(`${this.apiUrl}/iniciar`, { configuracion }, { headers })
      .pipe(
        tap((response) => {
          if (response.ok) {
            this.guardarEstadoSimulacion(response);
            this.simulacionActivaSubject.next(true);
          }
        }),
        catchError((error) => {
          console.error('Error al iniciar simulación:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Envía un mensaje del asesor y recibe respuesta del cliente
   */
  enviarMensaje(mensaje: string): Observable<EnviarMensajeResponse> {
    const headers = this.getHeaders();

    return this.http
      .post<EnviarMensajeResponse>(`${this.apiUrl}/mensaje`, { mensaje }, { headers })
      .pipe(
        tap((response) => {
          if (response.ok) {
            // Actualizar el estado local con el nuevo historial
            this.actualizarHistorialLocal(response);

            // Si la simulación finalizó, limpiar estado
            if (response.simulacion_finalizada) {
              this.limpiarSimulacionLocal();
            }
          }
        }),
        catchError((error) => {
          console.error('Error al enviar mensaje:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtiene el estado actual de la simulación
   */
  obtenerEstado(): Observable<EstadoSimulacion> {
    const headers = this.getHeaders();

    return this.http.get<EstadoSimulacion>(`${this.apiUrl}/estado`, { headers }).pipe(
      tap((response) => {
        if (response.ok) {
          this.guardarEstadoSimulacion(response);
          this.simulacionActivaSubject.next(true);
        }
      }),
      catchError((error) => {
        console.error('Error al obtener estado:', error);
        // Si no hay simulación activa, limpiar estado local
        if (error.status === 404) {
          this.limpiarSimulacionLocal();
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Finaliza la simulación actual
   */
  finalizarSimulacion(): Observable<FinalizarSimulacionResponse> {
    const headers = this.getHeaders();

    return this.http
      .post<FinalizarSimulacionResponse>(`${this.apiUrl}/finalizar`, {}, { headers })
      .pipe(
        tap((response) => {
          if (response.ok) {
            this.limpiarSimulacionLocal();
          }
        }),
        catchError((error) => {
          console.error('Error al finalizar simulación:', error);
          return throwError(() => error);
        })
      );
  }

  // ============================================
  // GESTIÓN DE ESTADO LOCAL
  // ============================================

  private guardarEstadoSimulacion(estado: EstadoSimulacion): void {
    localStorage.setItem(this.estadoSimulacionKey, JSON.stringify(estado));
    localStorage.setItem(this.simulacionActivaKey, 'true');
    this.estadoSimulacionSubject.next(estado);
  }

  private actualizarHistorialLocal(response: EnviarMensajeResponse): void {
    const estadoActual = this.obtenerEstadoLocal();
    if (estadoActual) {
      estadoActual.historial_conversacion = response.historialActualizado;

      // Actualizar análisis de aprendizaje si existe
      if (response.analisis_aprendizaje) {
        estadoActual.recomendaciones_aprendizaje.push(response.analisis_aprendizaje);
      }

      // Actualizar análisis de desempeño si existe
      if (response.analisis_desempeno) {
        estadoActual.analisis_desempeno = response.analisis_desempeno;
      }

      // Actualizar etapa actual si cambió
      if (response.etapa_cambiada && response.nueva_etapa) {
        estadoActual.etapa_actual = response.nueva_etapa;
        estadoActual.simulacion.etapa_actual_index = response.nueva_etapa.numero_orden;
      }

      this.guardarEstadoSimulacion(estadoActual);
    }
  }

  private limpiarSimulacionLocal(): void {
    localStorage.removeItem(this.estadoSimulacionKey);
    localStorage.removeItem(this.simulacionActivaKey);
    this.simulacionActivaSubject.next(false);
    this.estadoSimulacionSubject.next(null);
  }

  private obtenerEstadoLocal(): EstadoSimulacion | null {
    const estadoData = localStorage.getItem(this.estadoSimulacionKey);
    if (estadoData) {
      try {
        return JSON.parse(estadoData);
      } catch (e) {
        console.error('Error parsing simulacion data:', e);
        return null;
      }
    }
    return null;
  }

  private tieneSimulacionActiva(): boolean {
    return localStorage.getItem(this.simulacionActivaKey) === 'true';
  }

  private verificarSimulacionActiva(): void {
    if (this.tieneSimulacionActiva()) {
      // Verificar con el backend si realmente hay simulación activa
      this.obtenerEstado().subscribe({
        next: () => {
          // Estado sincronizado correctamente
        },
        error: () => {
          // No hay simulación activa, limpiar estado local
          this.limpiarSimulacionLocal();
        },
      });
    }
  }

  // ============================================
  // MÉTODOS DE UTILIDAD
  // ============================================

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  /**
   * Verifica si hay una simulación activa
   */
  haySimulacionActiva(): boolean {
    return this.simulacionActivaSubject.value;
  }

  /**
   * Obtiene el estado actual de la simulación desde memoria
   */
  obtenerEstadoActual(): EstadoSimulacion | null {
    return this.estadoSimulacionSubject.value;
  }

  /**
   * Obtiene el ID de la simulación activa
   */
  obtenerIdSimulacionActiva(): number | null {
    const estado = this.obtenerEstadoActual();
    return estado?.simulacion?.id_simulacion || null;
  }

  /**
   * Obtiene el historial de conversación actual
   */
  obtenerHistorialConversacion(): MensajeConversacion[] {
    const estado = this.obtenerEstadoActual();
    return estado?.historial_conversacion || [];
  }

  /**
   * Obtiene las recomendaciones de aprendizaje
   */
  obtenerRecomendacionesAprendizaje(): AnalisisAprendizaje[] {
    const estado = this.obtenerEstadoActual();
    return estado?.recomendaciones_aprendizaje || [];
  }

  /**
   * Verifica si la simulación está en modo aprendizaje
   */
  esModoAprendizaje(): boolean {
    const estado = this.obtenerEstadoActual();
    return estado?.simulacion?.modo === 'aprendizaje';
  }

  /**
   * Verifica si la simulación está en modo evaluativo
   */
  esModoEvaluativo(): boolean {
    const estado = this.obtenerEstadoActual();
    return estado?.simulacion?.modo === 'evaluativo';
  }

  /**
   * Obtiene información del cliente simulado
   */
  obtenerInfoCliente(): EscenarioCliente | null {
    const estado = this.obtenerEstadoActual();
    return estado?.escenario_cliente || null;
  }

  /**
   * Obtiene información del producto bancario
   */
  obtenerInfoProducto(): ProductoBancario | null {
    const estado = this.obtenerEstadoActual();
    return estado?.producto || null;
  }

  /**
   * Obtiene la etapa actual
   */
  obtenerEtapaActual(): EtapaConversacion | null {
    const estado = this.obtenerEstadoActual();
    return estado?.etapa_actual || null;
  }

  /**
   * Obtiene el progreso de la simulación (porcentaje)
   */
  obtenerProgreso(): number {
    const estado = this.obtenerEstadoActual();
    if (!estado?.simulacion) return 0;

    const { etapa_actual_index, total_etapas } = estado.simulacion;
    return Math.round((etapa_actual_index / total_etapas) * 100);
  }

  /**
   * Forzar limpieza del estado (útil para desarrollo/debugging)
   */
  forzarLimpiezaEstado(): void {
    this.limpiarSimulacionLocal();
  }
}
