import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError, fromEvent, merge } from 'rxjs';
import { filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AuthService } from '@app/core/auth/service/auth';
import { environment } from '../../../environments/environment';

// ============================================
// INTERFACES (mantener las existentes)
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
// SERVICIO OPTIMIZADO
// ============================================

@Injectable({
  providedIn: 'root',
})
export class SimulacionService {
  private apiUrl = `${environment.apiBaseUrl}/simulacion`;
  private simulacionActivaKey = 'simulacion_activa';
  private estadoSimulacionKey = 'estado_simulacion';
  private ultimaSincronizacionKey = 'ultima_sincronizacion';
  private versionEstadoKey = 'version_estado'; // Nuevo: para detectar cambios

  // Observable para el estado de la simulación activa
  private simulacionActivaSubject = new BehaviorSubject<boolean>(false);
  public simulacionActiva$ = this.simulacionActivaSubject.asObservable();

  // Observable para el estado completo de la simulación
  private estadoSimulacionSubject = new BehaviorSubject<EstadoSimulacion | null>(null);
  public estadoSimulacion$ = this.estadoSimulacionSubject.asObservable();

  // Control de sincronización
  private sincronizandoEstado = false;
  private ultimaPeticionTimestamp = 0;
  private readonly MIN_INTERVALO_PETICIONES = 2000; // 2 segundos mínimo

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // 1. Verificar estado inicial al cargar
    this.verificarEstadoInicial();

    // 2. Escuchar cambios en localStorage de otras pestañas
    this.escucharCambiosStorage();

    // 3. Escuchar eventos de visibilidad (cuando vuelve a la pestaña)
    this.escucharCambiosVisibilidad();

    // 4. Escuchar eventos de foco (cuando vuelve a la ventana)
    this.escucharCambiosFoco();
  }

  // ============================================
  // INICIALIZACIÓN Y EVENTOS
  // ============================================

  /**
   * Verifica el estado inicial al cargar el servicio
   * Solo hace una petición al servidor si es necesario
   */
  private verificarEstadoInicial(): void {
    const estadoLocal = this.obtenerEstadoLocal();

    if (estadoLocal) {
      console.log('📦 Estado local encontrado');
      this.estadoSimulacionSubject.next(estadoLocal);
      this.simulacionActivaSubject.next(true);

      // Verificar con servidor SOLO si el estado local existe
      // Pero hacer esto sin bloquear la UI
      setTimeout(() => {
        this.sincronizarConServidorUnaVez();
      }, 500);
    } else {
      console.log('ℹ️ No hay estado local, esperando inicio de simulación');
    }
  }

  /**
   * Escucha cambios en localStorage (otras pestañas/dispositivos)
   */
  private escucharCambiosStorage(): void {
    window.addEventListener('storage', (event) => {
      // Cambios en el estado de simulación
      if (event.key === this.estadoSimulacionKey) {
        if (event.newValue) {
          try {
            const nuevoEstado = JSON.parse(event.newValue);
            console.log('📱 Estado actualizado desde otra pestaña');
            this.estadoSimulacionSubject.next(nuevoEstado);
            this.simulacionActivaSubject.next(true);
          } catch (e) {
            console.error('Error al parsear estado:', e);
          }
        } else {
          console.log('🚫 Estado removido desde otra pestaña');
          this.limpiarSimulacionLocal();
        }
      }

      // Cambios en simulación activa
      if (event.key === this.simulacionActivaKey && event.newValue === null) {
        console.log('🚫 Simulación finalizada en otra pestaña');
        this.limpiarSimulacionLocal();
      }
    });
  }

  /**
   * Escucha cuando la página se vuelve visible
   * Solo sincroniza cuando el usuario regresa a la pestaña
   */
  private escucharCambiosVisibilidad(): void {
    fromEvent(document, 'visibilitychange')
      .pipe(
        filter(() => !document.hidden && this.simulacionActivaSubject.value),
        debounceTime(500)
      )
      .subscribe(() => {
        console.log('👁️ Usuario regresó a la pestaña, sincronizando...');
        this.sincronizarConServidorUnaVez();
      });
  }

  /**
   * Escucha cuando la ventana recupera el foco
   */
  private escucharCambiosFoco(): void {
    fromEvent(window, 'focus')
      .pipe(
        filter(() => this.simulacionActivaSubject.value),
        debounceTime(500)
      )
      .subscribe(() => {
        console.log('🔍 Ventana recuperó el foco, sincronizando...');
        this.sincronizarConServidorUnaVez();
      });
  }

  // ============================================
  // SINCRONIZACIÓN OPTIMIZADA
  // ============================================

  /**
   * Sincroniza con el servidor UNA SOLA VEZ
   * No hace polling continuo
   */
  private sincronizarConServidorUnaVez(): void {
    if (this.sincronizandoEstado) {
      console.log('⏸️ Sincronización ya en curso');
      return;
    }

    if (!this.puedeHacerPeticion()) {
      console.log('⏳ Esperando rate limit...');
      return;
    }

    this.sincronizandoEstado = true;
    this.ultimaPeticionTimestamp = Date.now();

    this.obtenerEstadoDesdeServidor().subscribe({
      next: (estadoServidor) => {
        const estadoLocal = this.obtenerEstadoLocal();

        if (this.hayDiferenciasConServidor(estadoLocal, estadoServidor)) {
          console.log('🔄 Actualizando estado desde servidor');
          this.guardarEstadoSimulacion(estadoServidor);
        } else {
          console.log('✅ Estado local sincronizado');
        }

        this.sincronizandoEstado = false;
      },
      error: (error) => {
        console.error('❌ Error en sincronización:', error);

        if (error.status === 404) {
          console.log('🚫 No hay simulación activa en servidor');
          this.limpiarSimulacionLocal();
        }

        this.sincronizandoEstado = false;
      },
    });
  }

  /**
   * Obtiene el estado desde el servidor (método interno)
   */
  private obtenerEstadoDesdeServidor(): Observable<EstadoSimulacion> {
    const headers = this.getHeaders();
    return this.http.get<EstadoSimulacion>(`${this.apiUrl}/estado`, { headers });
  }

  /**
   * Compara el estado local con el del servidor
   */
  private hayDiferenciasConServidor(
    estadoLocal: EstadoSimulacion | null,
    estadoServidor: EstadoSimulacion
  ): boolean {
    if (!estadoLocal) return true;

    // Comparar número de mensajes
    const mensajesLocal = estadoLocal.historial_conversacion?.length || 0;
    const mensajesServidor = estadoServidor.historial_conversacion?.length || 0;

    if (mensajesLocal !== mensajesServidor) {
      return true;
    }

    // Comparar etapa actual
    if (
      estadoLocal.simulacion?.etapa_actual_index !== estadoServidor.simulacion?.etapa_actual_index
    ) {
      return true;
    }

    // Comparar estado
    if (estadoLocal.simulacion?.estado !== estadoServidor.simulacion?.estado) {
      return true;
    }

    return false;
  }

  // ============================================
  // MÉTODOS PRINCIPALES
  // ============================================

  /**
   * Inicia una nueva simulación
   */
  async iniciarSimulacion(
    configuracion: ConfiguracionSimulacion
  ): Promise<Observable<IniciarSimulacionResponse>> {
    await this.esperarRateLimit();

    const headers = this.getHeaders();
    this.ultimaPeticionTimestamp = Date.now();

    return this.http
      .post<IniciarSimulacionResponse>(`${this.apiUrl}/iniciar`, { configuracion }, { headers })
      .pipe(
        tap((response) => {
          if (response.ok) {
            this.guardarEstadoSimulacion(response);
            this.simulacionActivaSubject.next(true);
            this.notificarCambioAPestanas();
          }
        }),
        catchError((error) => {
          console.error('❌ Error al iniciar simulación:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Envía un mensaje y sincroniza inmediatamente
   */
  async enviarMensaje(mensaje: string): Promise<Observable<EnviarMensajeResponse>> {
    await this.esperarRateLimit();

    const headers = this.getHeaders();
    this.ultimaPeticionTimestamp = Date.now();

    return this.http
      .post<EnviarMensajeResponse>(`${this.apiUrl}/mensaje`, { mensaje }, { headers })
      .pipe(
        tap((response) => {
          if (response.ok) {
            this.actualizarHistorialLocal(response);

            if (response.simulacion_finalizada) {
              this.limpiarSimulacionLocal();
            }

            this.notificarCambioAPestanas();
          }
        }),
        catchError((error) => {
          console.error('❌ Error al enviar mensaje:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtiene el estado actual (método público para verificación manual)
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
        if (error.status === 404) {
          this.limpiarSimulacionLocal();
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Finaliza la simulación
   */
  async finalizarSimulacion(): Promise<Observable<FinalizarSimulacionResponse>> {
    await this.esperarRateLimit();

    const headers = this.getHeaders();
    this.ultimaPeticionTimestamp = Date.now();

    return this.http
      .post<FinalizarSimulacionResponse>(`${this.apiUrl}/finalizar`, {}, { headers })
      .pipe(
        tap((response) => {
          if (response.ok) {
            this.limpiarSimulacionLocal();
            this.notificarCambioAPestanas();
          }
        }),
        catchError((error) => {
          console.error('❌ Error al finalizar:', error);
          return throwError(() => error);
        })
      );
  }

  // ============================================
  // GESTIÓN DE ESTADO LOCAL
  // ============================================

  private guardarEstadoSimulacion(estado: EstadoSimulacion): void {
    const version = Date.now();

    localStorage.setItem(this.estadoSimulacionKey, JSON.stringify(estado));
    localStorage.setItem(this.simulacionActivaKey, 'true');
    localStorage.setItem(this.versionEstadoKey, version.toString());
    localStorage.setItem(this.ultimaSincronizacionKey, version.toString());

    this.estadoSimulacionSubject.next(estado);
  }

  private actualizarHistorialLocal(response: EnviarMensajeResponse): void {
    const estadoActual = this.obtenerEstadoLocal();
    if (estadoActual) {
      estadoActual.historial_conversacion = response.historialActualizado;

      if (response.analisis_aprendizaje) {
        estadoActual.recomendaciones_aprendizaje.push(response.analisis_aprendizaje);
      }

      if (response.analisis_desempeno) {
        estadoActual.analisis_desempeno = response.analisis_desempeno;
      }

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
    localStorage.removeItem(this.versionEstadoKey);
    localStorage.removeItem(this.ultimaSincronizacionKey);
    this.simulacionActivaSubject.next(false);
    this.estadoSimulacionSubject.next(null);
  }

  private obtenerEstadoLocal(): EstadoSimulacion | null {
    const estadoData = localStorage.getItem(this.estadoSimulacionKey);
    if (estadoData) {
      try {
        return JSON.parse(estadoData);
      } catch (e) {
        console.error('Error parsing estado:', e);
        return null;
      }
    }
    return null;
  }

  private notificarCambioAPestanas(): void {
    const estadoActual = this.obtenerEstadoLocal();
    if (estadoActual) {
      window.dispatchEvent(
        new CustomEvent('simulacion-actualizada', {
          detail: estadoActual,
        })
      );
    }
  }

  // ============================================
  // RATE LIMITING
  // ============================================

  private puedeHacerPeticion(): boolean {
    const ahora = Date.now();
    const tiempoTranscurrido = ahora - this.ultimaPeticionTimestamp;
    return tiempoTranscurrido >= this.MIN_INTERVALO_PETICIONES;
  }

  private async esperarRateLimit(): Promise<void> {
    if (!this.puedeHacerPeticion()) {
      const tiempoEspera =
        this.MIN_INTERVALO_PETICIONES - (Date.now() - this.ultimaPeticionTimestamp);
      console.log(`⏳ Rate limit: esperando ${tiempoEspera}ms...`);
      await new Promise((resolve) => setTimeout(resolve, tiempoEspera));
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

  haySimulacionActiva(): boolean {
    return this.simulacionActivaSubject.value;
  }

  obtenerEstadoActual(): EstadoSimulacion | null {
    return this.estadoSimulacionSubject.value;
  }

  obtenerIdSimulacionActiva(): number | null {
    const estado = this.obtenerEstadoActual();
    return estado?.simulacion?.id_simulacion || null;
  }

  obtenerHistorialConversacion(): MensajeConversacion[] {
    const estado = this.obtenerEstadoActual();
    return estado?.historial_conversacion || [];
  }

  obtenerRecomendacionesAprendizaje(): AnalisisAprendizaje[] {
    const estado = this.obtenerEstadoActual();
    return estado?.recomendaciones_aprendizaje || [];
  }

  esModoAprendizaje(): boolean {
    const estado = this.obtenerEstadoActual();
    return estado?.simulacion?.modo === 'aprendizaje';
  }

  esModoEvaluativo(): boolean {
    const estado = this.obtenerEstadoActual();
    return estado?.simulacion?.modo === 'evaluativo';
  }

  obtenerInfoCliente(): EscenarioCliente | null {
    const estado = this.obtenerEstadoActual();
    return estado?.escenario_cliente || null;
  }

  obtenerInfoProducto(): ProductoBancario | null {
    const estado = this.obtenerEstadoActual();
    return estado?.producto || null;
  }

  obtenerEtapaActual(): EtapaConversacion | null {
    const estado = this.obtenerEstadoActual();
    return estado?.etapa_actual || null;
  }

  obtenerProgreso(): number {
    const estado = this.obtenerEstadoActual();
    if (!estado?.simulacion) return 0;

    const { etapa_actual_index, total_etapas } = estado.simulacion;
    return Math.round((etapa_actual_index / total_etapas) * 100);
  }

  forzarLimpiezaEstado(): void {
    console.log('🧹 Limpiando estado de simulación...');
    this.limpiarSimulacionLocal();
    this.notificarCambioAPestanas();
  }

  /**
   * Fuerza una sincronización manual (para casos especiales)
   */
  public forzarSincronizacion(): void {
    if (this.simulacionActivaSubject.value) {
      this.sincronizarConServidorUnaVez();
    }
  }

  /**
   * Verifica si hay una simulación activa en el servidor
   * Usado al iniciar la aplicación
   */
  public verificarSimulacionEnServidor(): Observable<EstadoSimulacion> {
    return this.obtenerEstado().pipe(
      tap(() => console.log('✅ Simulación encontrada en servidor')),
      catchError((error) => {
        if (error.status === 404) {
          console.log('ℹ️ No hay simulación activa');
        }
        return throwError(() => error);
      })
    );
  }
}
