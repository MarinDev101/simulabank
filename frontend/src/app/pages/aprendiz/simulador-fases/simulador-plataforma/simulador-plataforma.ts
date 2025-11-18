import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import {
  SimulacionService,
  EstadoSimulacion,
  MensajeConversacion,
  EtapaConversacion,
  AnalisisAprendizaje,
} from '@app/services/simulacion/simulacion';

@Component({
  selector: 'app-simulador-plataforma',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './simulador-plataforma.html',
})
export class SimuladorPlataformaComponent implements OnInit, OnDestroy {
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  @ViewChild('etapa') etapaDetails!: ElementRef;

  // Estado de la simulación
  estadoSimulacion: EstadoSimulacion | null = null;
  historialMensajes: MensajeConversacion[] = [];
  etapaActual: EtapaConversacion | null = null;
  recomendaciones: AnalisisAprendizaje[] = [];

  // Control de UI
  mensajeAsesor = '';
  enviandoMensaje = false;
  finalizandoSimulacion = false;
  error: string | null = null;
  tiempoTranscurrido = '00:00';

  // Subscripciones
  private subscriptions = new Subscription();
  private timerSubscription?: Subscription;

  constructor(private simulacionService: SimulacionService) {}

  ngOnInit() {
    this.cargarEstadoSimulacion();
    this.iniciarTemporizador();
    this.suscribirACambios();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  // ============================================
  // CARGA INICIAL
  // ============================================

  private cargarEstadoSimulacion() {
    const estado = this.simulacionService.obtenerEstadoActual();

    if (estado) {
      this.actualizarEstadoLocal(estado);
    } else {
      // Si no hay estado local, obtener del servidor
      this.simulacionService.obtenerEstado().subscribe({
        next: (response) => {
          this.actualizarEstadoLocal(response);
        },
        error: (error) => {
          console.error('Error al cargar estado:', error);
          this.error = 'No se pudo cargar el estado de la simulación';
        },
      });
    }
  }

  private suscribirACambios() {
    const sub = this.simulacionService.estadoSimulacion$.subscribe((estado) => {
      if (estado) {
        this.actualizarEstadoLocal(estado);
      }
    });
    this.subscriptions.add(sub);
  }

  private actualizarEstadoLocal(estado: EstadoSimulacion) {
    this.estadoSimulacion = estado;
    this.historialMensajes = estado.historial_conversacion || [];
    this.etapaActual = estado.etapa_actual;
    this.recomendaciones = estado.recomendaciones_aprendizaje || [];

    // Scroll al último mensaje
    setTimeout(() => this.scrollToBottom(), 100);
  }

  // ============================================
  // ENVÍO DE MENSAJES
  // ============================================

  enviarMensaje() {
    if (!this.mensajeAsesor.trim() || this.enviandoMensaje) {
      return;
    }

    this.enviandoMensaje = true;
    this.error = null;

    const mensaje = this.mensajeAsesor.trim();
    this.mensajeAsesor = '';

    console.log('📤 Enviando mensaje:', mensaje);

    this.simulacionService.enviarMensaje(mensaje).subscribe({
      next: (response) => {
        console.log('✅ Respuesta recibida:', response);

        this.enviandoMensaje = false;

        // Verificar si la simulación finalizó
        if (response.simulacion_finalizada) {
          this.manejarFinalizacionSimulacion(response);
        }

        // Scroll al último mensaje
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('❌ Error al enviar mensaje:', error);
        this.enviandoMensaje = false;
        this.error = error.error?.mensaje || 'Error al enviar el mensaje';
        this.mensajeAsesor = mensaje; // Restaurar mensaje
      },
    });
  }

  private manejarFinalizacionSimulacion(response: any) {
    if (response.motivo_finalizacion === 'salida_contexto') {
      alert('⚠️ La simulación ha finalizado porque te saliste del contexto de asesoría bancaria.');
    } else if (response.analisis_desempeno) {
      this.mostrarAnalisisDesempeno(response.analisis_desempeno);
    }
  }

  // ============================================
  // FINALIZAR SIMULACIÓN
  // ============================================

  finalizarSimulacion() {
    if (!confirm('¿Estás seguro de que deseas finalizar la simulación?')) {
      return;
    }

    this.finalizandoSimulacion = true;
    this.error = null;

    this.simulacionService.finalizarSimulacion().subscribe({
      next: (response) => {
        console.log('✅ Simulación finalizada:', response);
        alert('Simulación finalizada exitosamente');
        this.finalizandoSimulacion = false;
        // El servicio limpiará el estado y el componente padre detectará el cambio
      },
      error: (error) => {
        console.error('❌ Error al finalizar:', error);
        this.finalizandoSimulacion = false;
        this.error = error.error?.mensaje || 'Error al finalizar la simulación';
      },
    });
  }

  // ============================================
  // TEMPORIZADOR
  // ============================================

  private iniciarTemporizador() {
    if (!this.estadoSimulacion?.simulacion?.fecha_inicio) return;

    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.estadoSimulacion?.simulacion?.fecha_inicio) {
        const inicio = new Date(this.estadoSimulacion.simulacion.fecha_inicio).getTime();
        const ahora = Date.now();
        const diferencia = Math.floor((ahora - inicio) / 1000);

        const minutos = Math.floor(diferencia / 60);
        const segundos = diferencia % 60;

        this.tiempoTranscurrido = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
      }
    });
  }

  // ============================================
  // UTILIDADES UI
  // ============================================

  private scrollToBottom() {
    if (this.chatContainer) {
      const element = this.chatContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  cerrarIndicaciones() {
    if (this.etapaDetails?.nativeElement) {
      this.etapaDetails.nativeElement.removeAttribute('open');
    }
  }

  reproducirAudio(mensaje: string) {
    // Implementar síntesis de voz
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(mensaje);
      utterance.lang = 'es-ES';
      speechSynthesis.speak(utterance);
    }
  }

  private mostrarAnalisisDesempeno(analisis: any) {
    const mensaje = `
🎯 Análisis de Desempeño

Calificación: ${analisis.puntuacion_cualitativa}

${analisis.resumen_general}
    `;
    alert(mensaje);
  }

  // ============================================
  // GETTERS PARA TEMPLATE
  // ============================================

  get nombreCliente(): string {
    return this.estadoSimulacion?.escenario_cliente?.nombre || 'Cliente';
  }

  get avatarCliente(): string {
    return (
      this.estadoSimulacion?.escenario_cliente?.imagen ||
      'https://randomuser.me/api/portraits/men/94.jpg'
    );
  }

  get nombreEtapaActual(): string {
    return this.etapaActual?.nombre || 'Cargando...';
  }

  get objetivoEtapaActual(): string {
    return this.etapaActual?.objetivo || '';
  }

  get indiceEtapaActual(): number {
    return this.estadoSimulacion?.simulacion?.etapa_actual_index || 0;
  }

  get totalEtapas(): number {
    return this.estadoSimulacion?.simulacion?.total_etapas || 0;
  }

  get modoSimulacion(): string {
    const modo = this.estadoSimulacion?.simulacion?.modo;
    return modo === 'aprendizaje' ? 'Aprendizaje' : 'Evaluativo';
  }

  get esModoAprendizaje(): boolean {
    return this.simulacionService.esModoAprendizaje();
  }

  get recomendacionActual(): AnalisisAprendizaje | null {
    if (!this.recomendaciones.length) return null;
    return this.recomendaciones[this.recomendaciones.length - 1] || null;
  }

  get progreso(): number {
    return this.simulacionService.obtenerProgreso();
  }

  get infoCliente() {
    return this.estadoSimulacion?.escenario_cliente || null;
  }

  get infoProducto() {
    return this.estadoSimulacion?.producto || null;
  }

  get tipoCliente() {
    return this.estadoSimulacion?.tipo_cliente || null;
  }

  get perfilCliente() {
    return this.estadoSimulacion?.perfil_cliente || null;
  }

  // Agrupar mensajes por etapa
  get mensajesPorEtapa(): { [key: number]: MensajeConversacion[] } {
    const grupos: { [key: number]: MensajeConversacion[] } = {};

    this.historialMensajes.forEach((mensaje) => {
      if (!grupos[mensaje.indiceEtapa]) {
        grupos[mensaje.indiceEtapa] = [];
      }
      grupos[mensaje.indiceEtapa].push(mensaje);
    });

    return grupos;
  }

  // Obtener lista ordenada de índices de etapa
  get indicesEtapas(): number[] {
    return Object.keys(this.mensajesPorEtapa)
      .map((key) => parseInt(key))
      .sort((a, b) => a - b);
  }
}
