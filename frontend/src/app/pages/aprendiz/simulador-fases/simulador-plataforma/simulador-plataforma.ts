import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import {
  SimulacionService,
  EstadoSimulacion,
  MensajeConversacion,
  EtapaConversacion,
  AnalisisAprendizaje,
  AnalisisDesempeno,
} from '@app/services/simulacion/simulacion';
import { AuthService, Usuario } from '@app/core/auth/service/auth';
import { PoliticasPlataforma } from '@app/pages/aprendiz-instructor/politicas-plataforma/politicas-plataforma';

interface MensajeSistema {
  tipo: 'info' | 'warning' | 'success' | 'error';
  mensaje: string;
  timestamp: Date;
}

interface AudioQueueItem {
  id: string;
  texto: string;
  isLastOfPreviousStage: boolean;
  isFirstOfNewStage: boolean;
}

@Component({
  selector: 'app-simulador-plataforma',
  standalone: true,
  imports: [CommonModule, FormsModule, PoliticasPlataforma],
  templateUrl: './simulador-plataforma.html',
  styleUrls: ['./simulador-plataforma.css'],
  host: {
    class: 'simulador-plataforma-page',
  },
})
export class SimuladorPlataformaComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  @ViewChild('etapa') etapaDetails!: ElementRef;
  @ViewChild('modalPoliticas') modalPoliticas!: ElementRef<HTMLDialogElement>;
  @ViewChild('modalFinalizar') modalFinalizar!: ElementRef<HTMLDialogElement>;
  @ViewChild('modalAnalisis') modalAnalisis!: ElementRef<HTMLDialogElement>;
  @ViewChild('mensajeTextarea') mensajeTextarea!: ElementRef<HTMLTextAreaElement>;

  // Estado de la simulación
  estadoSimulacion: EstadoSimulacion | null = null;
  historialMensajes: MensajeConversacion[] = [];
  etapaActual: EtapaConversacion | null = null;
  recomendaciones: AnalisisAprendizaje[] = [];
  mensajesSistema: MensajeSistema[] = [];
  usuarioActual: Usuario | null = null;

  // Control de UI
  mensajeAsesor = '';
  enviandoMensaje = false;
  mostrarIndicadorEscritura = false;
  indicadorEmisor: 'Asesor' | 'Cliente' | null = null;
  finalizandoSimulacion = false;
  error: string | null = null;
  tiempoTranscurrido = '00:00';
  sonidoHabilitado = true;
  menuAbierto = false;

  // Datos de finalización
  datosFinalizacion: any = null;
  analisisDesempeno: AnalisisDesempeno | null = null;

  // Control de scroll
  private shouldScrollToBottom = false;
  private isNearBottom = true;

  // Reconocimiento de voz
  private recognition: any = null;
  grabandoVoz = false;
  private dictadoSessionId = 0;
  private reconocimientoActivo = false;
  private caretStart = 0;
  private caretEnd = 0;

  // Preview combinado
  get mensajePreview(): string {
    return this.mensajeAsesor || '';
  }

  onTextareaInput(event: any) {
    const value = event.target.value || '';
    this.mensajeAsesor = value;

    try {
      const ta = event.target as HTMLTextAreaElement;
      this.caretStart = typeof ta.selectionStart === 'number' ? ta.selectionStart : 0;
      this.caretEnd = typeof ta.selectionEnd === 'number' ? ta.selectionEnd : this.caretStart;
    } catch (e) {
      console.warn('Error actualizando caret en onTextareaInput:', e);
    }
  }

  // Estado de audio con cola de reproducción
  public audioActualId: string | null = null;
  private audioQueue: AudioQueueItem[] = [];
  private isProcessingQueue = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private manualStop = false; // Flag para saber si el usuario detuvo manualmente

  // Tracking de etapa anterior para detectar cambios
  private etapaAnteriorIndex: number | null = null;

  // Subscripciones
  private subscriptions = new Subscription();
  private timerSubscription?: Subscription;
  private drawerListeners: Array<() => void> = [];

  // Modo solo lectura
  @Input() modoSoloLectura = false;

  // Eventos hacia el componente padre
  @Output() onRequestReturnToConfig = new EventEmitter<void>();
  @Output() onRequestViewReadonly = new EventEmitter<void>();

  constructor(
    private simulacionService: SimulacionService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarUsuario();
    this.cargarEstadoSimulacion();
    this.iniciarTemporizador();
    this.suscribirACambios();
    this.inicializarReconocimientoVoz();
    this.inicializarListenersDrawers();
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    if (this.recognition) {
      this.recognition.stop();
    }
    if ('speechSynthesis' in window) {
      try {
        speechSynthesis.cancel();
      } catch (e) {
        console.warn(e);
      }
    }
    this.audioActualId = null;
    this.audioQueue = [];
    this.drawerListeners.forEach((remove) => remove());
  }

  private inicializarListenersDrawers() {
    try {
      const ids = ['drawer-recommendations', 'drawer-client-info'];
      ids.forEach((id) => {
        const el = document.getElementById(id) as HTMLInputElement | null;
        if (!el) return;
        const handler = () => {
          if (el.checked) {
            document.body.classList.add('drawer-open');
          } else {
            document.body.classList.remove('drawer-open');
          }
        };
        el.addEventListener('change', handler);
        this.drawerListeners.push(() => el.removeEventListener('change', handler));
      });
    } catch (e) {
      console.warn('No se pudieron inicializar listeners de drawers:', e);
    }

    // Quitar padding en móvil
    this.aplicarEstilosSinPadding();
  }

  private aplicarEstilosSinPadding() {
    const aplicarEstilo = () => {
      // Solo aplicar si estamos en la ruta del simulador
      if (!window.location.pathname.includes('/simulador')) {
        return;
      }

      const contenedor = document.querySelector('.drawer-content > div:last-child') as HTMLElement;
      if (contenedor && window.innerWidth <= 639) {
        contenedor.style.padding = '0';
      } else if (contenedor) {
        contenedor.style.padding = '';
      }
    };

    aplicarEstilo();
    window.addEventListener('resize', aplicarEstilo);
    this.drawerListeners.push(() => window.removeEventListener('resize', aplicarEstilo));
  }

  // ============================================
  // CARGA INICIAL
  // ============================================

  private cargarUsuario() {
    const sub = this.authService.currentUser$.subscribe((usuario) => {
      this.usuarioActual = usuario;
    });
    this.subscriptions.add(sub);
  }

  private cargarEstadoSimulacion() {
    const estado = this.simulacionService.obtenerEstadoActual();

    if (estado) {
      console.log('📦 Cargando estado desde servicio');
      this.actualizarEstadoLocal(estado);

      if (this.historialMensajes.length === 0) {
        this.agregarMensajeSistema(
          'info',
          '¡Bienvenido a la simulación! Inicia la conversación con el cliente.'
        );
      }
    } else {
      console.log('🔍 No hay estado en servicio, verificando con servidor...');
      const sub = this.simulacionService.obtenerEstado().subscribe({
        next: (response) => {
          console.log('✅ Estado cargado desde servidor');
          this.actualizarEstadoLocal(response);
        },
        error: (error) => {
          console.error('❌ Error al cargar estado:', error);
          this.error = 'No se pudo cargar el estado de la simulación';
        },
      });
      this.subscriptions.add(sub);
    }
  }

  private suscribirACambios() {
    const sub = this.simulacionService.estadoSimulacion$.subscribe((estado) => {
      if (estado) {
        const prevIndex = this.etapaAnteriorIndex;
        console.log('🔄 Estado actualizado desde servicio');

        this.actualizarEstadoLocal(estado);

        const newIndex = estado.simulacion?.etapa_actual_index || null;

        // Detectar cambio de etapa
        if (prevIndex !== null && newIndex !== null && prevIndex !== newIndex) {
          console.log(`🎯 Cambio de etapa detectado: ${prevIndex} → ${newIndex}`);
          this.agregarMensajeSistema('info', `➡ Se inició la etapa: ${estado.etapa_actual.nombre}`);

          if (estado.historial_conversacion && estado.historial_conversacion.length) {
            this.historialMensajes = estado.historial_conversacion;
          }
          this.etapaActual = estado.etapa_actual;
          this.shouldScrollToBottom = true;

          // Programar reproducción en cadena si el sonido está habilitado
          if (this.sonidoHabilitado) {
            setTimeout(() => {
              this.reproducirMensajesCambioEtapa(prevIndex, newIndex);
            }, 500);
          }
        }

        // Actualizar etapa anterior para próxima comparación
        this.etapaAnteriorIndex = newIndex;
      }
    });
    this.subscriptions.add(sub);
  }

  private actualizarEstadoLocal(estado: EstadoSimulacion) {
    const mensajesAnteriores = this.historialMensajes.length;

    this.estadoSimulacion = estado;
    this.historialMensajes = estado.historial_conversacion || [];
    this.etapaActual = estado.etapa_actual;
    this.recomendaciones = estado.recomendaciones_aprendizaje || [];
    this.analisisDesempeno = estado.analisis_desempeno || null;

    this.sonidoHabilitado = estado.simulacion?.sonido_interaccion === 'automatico';

    if (this.historialMensajes.length > mensajesAnteriores) {
      this.shouldScrollToBottom = true;
      this.indicadorEmisor = null;
    }

    if (estado.simulacion?.estado === 'finalizada') {
      if (this.timerSubscription) {
        try {
          this.timerSubscription.unsubscribe();
        } catch (err) {
          console.warn('No se pudo detener el temporizador:', err);
        }
      }
    }

    // Inicializar etapaAnteriorIndex si es null
    if (this.etapaAnteriorIndex === null) {
      this.etapaAnteriorIndex = estado.simulacion?.etapa_actual_index || null;
    }
  }

  // ============================================
  // REPRODUCCIÓN EN CADENA AL CAMBIAR ETAPA
  // ============================================

  private reproducirMensajesCambioEtapa(etapaAnterior: number, etapaNueva: number) {
    console.log('🎵 Iniciando reproducción en cadena por cambio de etapa');

    // Buscar el último mensaje del cliente de la etapa anterior
    const mensajesEtapaAnterior = this.historialMensajes.filter(
      (m) => m.indiceEtapa === etapaAnterior && m.receptor === 'Asesor'
    );

    // Buscar el primer mensaje del cliente de la nueva etapa
    const mensajesEtapaNueva = this.historialMensajes.filter(
      (m) => m.indiceEtapa === etapaNueva && m.receptor === 'Asesor'
    );

    const ultimoMensajeAnterior =
      mensajesEtapaAnterior.length > 0
        ? mensajesEtapaAnterior[mensajesEtapaAnterior.length - 1]
        : null;

    const primerMensajeNuevo = mensajesEtapaNueva.length > 0 ? mensajesEtapaNueva[0] : null;

    if (!ultimoMensajeAnterior && !primerMensajeNuevo) {
      console.log('⚠️ No hay mensajes para reproducir en el cambio de etapa');
      return;
    }

    // Construir la cola de reproducción
    const queue: AudioQueueItem[] = [];

    if (ultimoMensajeAnterior) {
      const idUltimoAnterior = this.construirIdMensaje(ultimoMensajeAnterior, etapaAnterior);
      queue.push({
        id: idUltimoAnterior,
        texto: ultimoMensajeAnterior.mensaje,
        isLastOfPreviousStage: true,
        isFirstOfNewStage: false,
      });
      console.log('📝 Agregado a cola: último mensaje etapa anterior', idUltimoAnterior);
    }

    if (primerMensajeNuevo) {
      const idPrimeroNuevo = this.construirIdMensaje(primerMensajeNuevo, etapaNueva);
      queue.push({
        id: idPrimeroNuevo,
        texto: primerMensajeNuevo.mensaje,
        isLastOfPreviousStage: false,
        isFirstOfNewStage: true,
      });
      console.log('📝 Agregado a cola: primer mensaje etapa nueva', idPrimeroNuevo);
    }

    // Iniciar reproducción de la cola
    this.reproducirCola(queue);
  }

  private construirIdMensaje(mensaje: MensajeConversacion, etapaIdx: number): string {
    const mensajesEnEtapa = this.historialMensajes.filter(
      (m) => m.indiceEtapa === etapaIdx && m.receptor === 'Asesor'
    );
    const position = mensajesEnEtapa.findIndex(
      (m) => m.mensaje === mensaje.mensaje && m.indiceEtapa === mensaje.indiceEtapa
    );
    return `msg-${etapaIdx}-${position >= 0 ? position : 0}`;
  }

  private reproducirCola(queue: AudioQueueItem[]) {
    if (queue.length === 0) {
      console.log('✅ Cola de reproducción vacía');
      return;
    }

    // Si ya hay algo reproduciéndose, detenerlo primero
    if (this.audioActualId !== null) {
      console.log('⏹️ Deteniendo reproducción actual antes de iniciar cola');
      this.detenerAudioActual();
    }

    this.audioQueue = [...queue];
    this.isProcessingQueue = true;
    this.manualStop = false;

    console.log(`🎬 Iniciando cola de ${this.audioQueue.length} mensajes`);
    this.procesarSiguienteEnCola();
  }

  private procesarSiguienteEnCola() {
    // Si el usuario detuvo manualmente o no hay más items, terminar
    if (this.manualStop || this.audioQueue.length === 0) {
      console.log('🏁 Fin de cola de reproducción', {
        manualStop: this.manualStop,
        queueLength: this.audioQueue.length,
      });
      this.isProcessingQueue = false;
      this.audioQueue = [];
      return;
    }

    const item = this.audioQueue.shift();
    if (!item) {
      this.isProcessingQueue = false;
      return;
    }

    console.log('▶️ Reproduciendo desde cola:', item.id);

    const utterance = new SpeechSynthesisUtterance(item.texto);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;

    utterance.onend = () => {
      console.log('✅ Reproducción completada:', item.id);

      // Solo continuar con el siguiente si no fue detenido manualmente
      if (!this.manualStop && this.audioActualId === item.id) {
        this.audioActualId = null;

        try {
          this.cdr.detectChanges();
        } catch (e) {}

        // Pequeña pausa entre mensajes
        setTimeout(() => {
          this.procesarSiguienteEnCola();
        }, 300);
      } else {
        console.log('⏸️ No continuar cola (manualStop o ID cambió)');
        this.audioActualId = null;
        this.isProcessingQueue = false;
        this.audioQueue = [];

        try {
          this.cdr.detectChanges();
        } catch (e) {}
      }
    };

    utterance.onerror = (e) => {
      console.error('❌ Error en reproducción de cola:', e);
      this.audioActualId = null;
      this.isProcessingQueue = false;
      this.audioQueue = [];

      try {
        this.cdr.detectChanges();
      } catch (err) {}
    };

    this.audioActualId = item.id;
    this.currentUtterance = utterance;

    try {
      this.cdr.detectChanges();
    } catch (e) {}

    speechSynthesis.speak(utterance);
  }

  private detenerAudioActual() {
    this.manualStop = true;

    try {
      speechSynthesis.cancel();
    } catch (e) {
      console.warn('Error cancelando síntesis:', e);
    }

    this.audioActualId = null;
    this.currentUtterance = null;
    this.isProcessingQueue = false;
    this.audioQueue = [];

    try {
      this.cdr.detectChanges();
    } catch (e) {}

    console.log('⏹️ Audio detenido y cola limpiada');
  }

  // ============================================
  // RECONOCIMIENTO DE VOZ
  // ============================================

  private inicializarReconocimientoVoz() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('El navegador no soporta reconocimiento de voz');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'es-ES';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      if (!this.reconocimientoActivo) return;

      try {
        let textoCompleto = '';

        const startIndex = typeof event.resultIndex === 'number' ? event.resultIndex : 0;
        for (let i = startIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result && result[0] && result[0].transcript) {
            if (result.isFinal) {
              textoCompleto += result[0].transcript + ' ';
            }
          }
        }

        if (textoCompleto.trim()) {
          this.insertAtCaret(textoCompleto.trim());
        }
      } catch (e) {
        console.warn('Error procesando resultado de voz:', e);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Error en reconocimiento de voz:', event.error);

      const recoverable =
        event.error === 'no-speech' || event.error === 'aborted' || event.error === 'network';

      if (this.grabandoVoz && recoverable) {
        setTimeout(() => {
          if (this.reconocimientoActivo) {
            try {
              this.recognition.start();
            } catch (e) {
              console.warn('No se pudo reiniciar recognition:', e);
            }
          }
        }, 300);
        return;
      }

      this.detenerDictado();
      this.agregarMensajeSistema(
        'error',
        'Error al reconocer la voz. Por favor, intenta nuevamente.'
      );
    };

    this.recognition.onend = () => {
      if (this.reconocimientoActivo && this.grabandoVoz) {
        try {
          this.recognition.start();
        } catch (e) {
          console.warn('No se pudo reiniciar el reconocimiento al terminar:', e);
          this.detenerDictado();
        }
      }
    };
  }

  toggleDictado() {
    if (!this.recognition) {
      this.agregarMensajeSistema(
        'warning',
        'El reconocimiento de voz no está disponible en este navegador.'
      );
      return;
    }

    if (this.grabandoVoz) {
      this.detenerDictado();
    } else {
      this.iniciarDictado();
    }
  }

  private iniciarDictado() {
    try {
      this.dictadoSessionId += 1;
      this.reconocimientoActivo = true;
      this.grabandoVoz = true;

      this.recognition.start();
      this.agregarMensajeSistema('info', '🎤 Escuchando... Habla ahora.');
    } catch (e) {
      console.warn('No se pudo iniciar reconocimiento:', e);
      this.agregarMensajeSistema('error', 'No se pudo acceder al micrófono. Revisa permisos.');
      this.detenerDictado();
    }
  }

  private detenerDictado() {
    try {
      this.reconocimientoActivo = false;
      this.grabandoVoz = false;
      this.recognition.stop();
      this.agregarMensajeSistema('success', '✓ Dictado detenido');
    } catch (e) {
      console.warn('Error al detener reconocimiento:', e);
      this.reconocimientoActivo = false;
      this.grabandoVoz = false;
    }
  }

  private insertAtCaret(text: string) {
    try {
      let el: HTMLTextAreaElement | null = null;
      if (this.mensajeTextarea && this.mensajeTextarea.nativeElement) {
        el = this.mensajeTextarea.nativeElement;
      } else {
        el = document.querySelector('textarea');
      }

      const start =
        el && typeof el.selectionStart === 'number' ? el.selectionStart : this.caretStart;
      const end = el && typeof el.selectionEnd === 'number' ? el.selectionEnd : this.caretEnd;

      const before = this.mensajeAsesor.slice(0, start);
      const after = this.mensajeAsesor.slice(end);

      let prefix = '';
      let suffix = '';

      if (before.length > 0 && !/\s$/.test(before)) {
        prefix = ' ';
      }

      if (after.length > 0 && !/^\s/.test(after)) {
        suffix = ' ';
      }

      if (after.length === 0 && suffix === '') {
        suffix = ' ';
      }

      this.mensajeAsesor = before + (prefix ? prefix : '') + text + (suffix ? suffix : '') + after;

      const newPos = (before + (prefix ? prefix : '') + text).length;
      if (el) {
        el.value = this.mensajeAsesor;
        el.focus();
        el.selectionStart = el.selectionEnd = newPos;
      }

      this.caretStart = this.caretEnd = newPos;
    } catch (e) {
      console.warn('Error insertando dictado en caret:', e);
      this.mensajeAsesor = (this.mensajeAsesor + ' ' + text).trim();
    }
  }

  // ============================================
  // REPRODUCCIÓN DE AUDIO (botones individuales)
  // ============================================

  toggleAudio(texto: string, id: string): void {
    console.log('toggleAudio llamado:', { id, audioActualId: this.audioActualId });

    if (!('speechSynthesis' in window)) {
      console.warn('speechSynthesis no disponible');
      return;
    }

    // Si es el mismo que está sonando, detenerlo
    if (this.audioActualId === id) {
      console.log('Deteniendo audio actual');
      this.detenerAudioActual();
      return;
    }

    // Si hay otro sonando (incluyendo cola), detenerlo primero
    if (this.audioActualId !== null || this.isProcessingQueue) {
      console.log('Deteniendo audio previo:', this.audioActualId);
      this.detenerAudioActual();
    }

    // Reproducir el nuevo
    console.log('Iniciando reproducción individual:', id);
    this.manualStop = false; // Reset del flag

    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;

    utterance.onend = () => {
      console.log('Audio terminado:', id);
      if (this.audioActualId === id) {
        this.audioActualId = null;
        try {
          this.cdr.detectChanges();
        } catch (e) {}
      }
    };

    utterance.onerror = (e) => {
      console.error('Error en audio:', e);
      if (this.audioActualId === id) {
        this.audioActualId = null;
        try {
          this.cdr.detectChanges();
        } catch (err) {}
      }
    };

    this.audioActualId = id;
    this.currentUtterance = utterance;

    try {
      this.cdr.detectChanges();
    } catch (e) {}

    speechSynthesis.speak(utterance);
  }

  isPlaying(id: string): boolean {
    return this.audioActualId === id;
  }

  // ============================================
  // ENVÍO DE MENSAJES
  // ============================================

  async enviarMensaje() {
    const mensaje = (this.mensajeAsesor || '').trim();

    try {
      if (this.reconocimientoActivo || this.grabandoVoz) {
        this.detenerDictado();
        this.agregarMensajeSistema('info', '🎤 Micrófono desactivado al enviar el mensaje');
      }
    } catch (e) {
      console.warn('Error deteniendo dictado al enviar mensaje:', e);
    }

    if (this.modoSoloLectura) {
      this.agregarMensajeSistema(
        'warning',
        'Esta simulación está en modo solo lectura. No se pueden enviar mensajes.'
      );
      return;
    }

    if (!mensaje || this.enviandoMensaje || this.finalizandoSimulacion) {
      return;
    }

    this.enviandoMensaje = true;
    this.mostrarIndicadorEscritura = true;
    this.indicadorEmisor = null;
    this.error = null;

    try {
      const mensajeLocal: MensajeConversacion = {
        indiceEtapa: this.indiceEtapaActual,
        totalEtapas: this.totalEtapas,
        nombreEtapa: this.nombreEtapaActual,
        objetivoEtapa: this.objetivoEtapaActual,
        emisor: 'Asesor',
        mensaje: mensaje,
        receptor: 'Cliente',
      };

      this.historialMensajes = [...this.historialMensajes, mensajeLocal];
      this.shouldScrollToBottom = true;
    } catch (e) {
      console.warn('No se pudo añadir mensaje localmente:', e);
    }

    this.mensajeAsesor = '';

    console.log('📤 Enviando mensaje:', mensaje);

    try {
      const enviarObservable = await this.simulacionService.enviarMensaje(mensaje);

      const sub = enviarObservable.subscribe({
        next: (response) => {
          console.log('✅ Respuesta recibida:', response);

          this.enviandoMensaje = false;
          this.mostrarIndicadorEscritura = false;
          this.indicadorEmisor = null;

          if (response.historialActualizado && Array.isArray(response.historialActualizado)) {
            this.historialMensajes = response.historialActualizado;
          }

          // Reproducir audio automáticamente si está habilitado Y no hay cambio de etapa
          // (si hay cambio de etapa, la reproducción en cadena se maneja en suscribirACambios)
          const textoAudio = response.mensajes?.cliente?.mensaje || response.mensaje || '';
          const huboCambioEtapa = response.etapa_cambiada;

          if (this.sonidoHabilitado && textoAudio && !huboCambioEtapa) {
            setTimeout(() => {
              if (this.audioActualId === null && !this.isProcessingQueue) {
                try {
                  const historial = this.historialMensajes || [];
                  let lastClientMsg: any = null;
                  for (let i = historial.length - 1; i >= 0; i--) {
                    const m = historial[i];
                    if (m && m.receptor === 'Asesor') {
                      lastClientMsg = m;
                      break;
                    }
                  }

                  if (lastClientMsg) {
                    const etapaIdx = lastClientMsg.indiceEtapa;
                    const mensajesEnEtapa = historial.filter(
                      (m) => m.indiceEtapa === etapaIdx && m.receptor === 'Asesor'
                    );
                    const position = mensajesEnEtapa.findIndex((m) => m === lastClientMsg);
                    const msgId = `msg-${etapaIdx}-${position}`;
                    this.toggleAudio(textoAudio, msgId);
                    return;
                  }
                } catch (e) {
                  console.warn('No se pudo asociar reproducción automática a mensaje:', e);
                }

                const fallbackId = 'auto-' + Date.now();
                this.toggleAudio(textoAudio, fallbackId);
              }
            }, 500);
          }

          if (response.nueva_etapa) {
            this.etapaActual = response.nueva_etapa;

            if (response.etapa_cambiada) {
              this.agregarMensajeSistema(
                'success',
                `✓ Has avanzado a la siguiente etapa: ${response.nueva_etapa.nombre}`
              );
            }
          }

          if (response.simulacion_finalizada) {
            this.manejarFinalizacionSimulacion(response);
          }

          this.shouldScrollToBottom = true;
        },
        error: (error) => {
          console.error('❌ Error al enviar mensaje:', error);

          this.enviandoMensaje = false;
          this.mostrarIndicadorEscritura = false;
          this.indicadorEmisor = null;

          if (error.status === 429) {
            this.error = 'Demasiadas solicitudes. Por favor, espera un momento.';
          } else {
            this.error = error.error?.mensaje || 'Error al enviar el mensaje';
          }

          this.mensajeAsesor = mensaje;

          this.agregarMensajeSistema(
            'error',
            'Error al enviar el mensaje. Por favor, intenta nuevamente.'
          );
        },
      });

      this.subscriptions.add(sub);

      this.indicadorEmisor = 'Cliente';
    } catch (error: any) {
      console.error('❌ Error inesperado al enviar mensaje:', error);

      this.enviandoMensaje = false;
      this.mostrarIndicadorEscritura = false;
      this.indicadorEmisor = null;
      this.error = 'Error inesperado al enviar el mensaje';
      this.mensajeAsesor = mensaje;
    }
  }

  private manejarFinalizacionSimulacion(response: any) {
    this.datosFinalizacion = response;

    if (this.timerSubscription) {
      try {
        this.timerSubscription.unsubscribe();
      } catch (err) {
        console.warn('No se pudo detener el temporizador tras finalización:', err);
      }
    }

    if (response.motivo_finalizacion === 'salida_contexto') {
      this.agregarMensajeSistema(
        'warning',
        '⚠️ La simulación ha finalizado porque te has salido del contexto de asesoría bancaria.'
      );
      this.mostrarModalResumen();
    } else if (response.analisis_desempeno) {
      this.analisisDesempeno = response.analisis_desempeno;
      this.agregarMensajeSistema(
        'success',
        '✅ ¡Has completado exitosamente todas las etapas de la simulación!'
      );
      this.mostrarModalAnalisisDesempeno(response);
    } else {
      this.agregarMensajeSistema(
        'info',
        'La simulación ha finalizado. Puedes revisar tu desempeño.'
      );
      this.mostrarModalResumen();
    }
  }

  // ============================================
  // FINALIZAR SIMULACIÓN
  // ============================================

  confirmarFinalizacion() {
    const estadoFinalizado =
      this.estadoSimulacion?.simulacion?.estado === 'finalizada' ||
      !this.simulacionService.haySimulacionActiva();

    if (estadoFinalizado) {
      this.simulacionService.forzarLimpiezaEstado();
      this.onRequestReturnToConfig.emit();
      return;
    }

    if (this.modalFinalizar?.nativeElement) {
      this.modalFinalizar.nativeElement.showModal();
    }
  }

  cerrarModalFinalizar() {
    if (this.modalFinalizar?.nativeElement) {
      this.modalFinalizar.nativeElement.close();
    }
  }

  async finalizarSimulacion() {
    this.cerrarModalFinalizar();
    this.finalizandoSimulacion = true;
    this.error = null;

    try {
      const finalizarObservable = await this.simulacionService.finalizarSimulacion();

      const sub = finalizarObservable.subscribe({
        next: (response) => {
          console.log('✅ Simulación finalizada:', response);
          this.finalizandoSimulacion = false;
          this.datosFinalizacion = response;

          this.agregarMensajeSistema('info', 'Simulación finalizada correctamente.');
          this.mostrarModalResumen();
        },
        error: (error) => {
          console.error('❌ Error al finalizar:', error);
          this.finalizandoSimulacion = false;

          if (error.status === 429) {
            this.error = 'Demasiadas solicitudes. Por favor, espera un momento.';
          } else {
            this.error = error.error?.mensaje || 'Error al finalizar la simulación';
          }

          this.agregarMensajeSistema('error', 'Error al finalizar la simulación.');
        },
      });

      this.subscriptions.add(sub);
    } catch (error: any) {
      console.error('❌ Error inesperado al finalizar:', error);
      this.finalizandoSimulacion = false;
      this.error = 'Error inesperado al finalizar la simulación';
      this.agregarMensajeSistema('error', 'Error inesperado al finalizar la simulación.');
    }
  }

  // ============================================
  // MODALES
  // ============================================

  abrirModalPoliticas() {
    if (this.modalPoliticas?.nativeElement) {
      this.modalPoliticas.nativeElement.showModal();
    }
  }

  cerrarModalPoliticas() {
    if (this.modalPoliticas?.nativeElement) {
      this.modalPoliticas.nativeElement.close();
    }
  }

  mostrarModalAnalisisDesempeno(response: any) {
    this.analisisDesempeno = response.analisis_desempeno;
    this.datosFinalizacion = response;

    if (this.modalAnalisis?.nativeElement) {
      this.modalAnalisis.nativeElement.showModal();
    }
  }

  mostrarModalResumen() {
    if (this.modalAnalisis?.nativeElement) {
      this.modalAnalisis.nativeElement.showModal();
    }
  }

  cerrarModalAnalisis() {
    if (this.modalAnalisis?.nativeElement) {
      this.modalAnalisis.nativeElement.close();
    }
  }

  iniciarNuevaSimulacion() {
    this.cerrarModalAnalisis();
    this.simulacionService.forzarLimpiezaEstado();
    this.onRequestReturnToConfig.emit();
  }

  salirDeSimulacion() {
    console.log('👋 Saliendo de la simulación...');
    this.cerrarModalAnalisis();
    this.onRequestViewReadonly.emit();
  }

  volverAVerSimulacion() {
    this.cerrarModalAnalisis();
    this.onRequestViewReadonly.emit();
  }

  // ============================================
  // MENSAJES DEL SISTEMA
  // ============================================

  private agregarMensajeSistema(tipo: 'info' | 'warning' | 'success' | 'error', mensaje: string) {
    const mensajeSistema: MensajeSistema = {
      tipo,
      mensaje,
      timestamp: new Date(),
    };

    this.mensajesSistema.push(mensajeSistema);
    this.shouldScrollToBottom = true;

    setTimeout(() => {
      const index = this.mensajesSistema.indexOf(mensajeSistema);
      if (index > -1) {
        this.mensajesSistema.splice(index, 1);
      }
    }, 10000);
  }

  obtenerClaseMensajeSistema(tipo: string): string {
    const clases = {
      info: 'alert-info',
      warning: 'alert-warning',
      success: 'alert-success',
      error: 'alert-error',
    };
    return clases[tipo as keyof typeof clases] || 'alert-info';
  }

  obtenerIconoMensajeSistema(tipo: string): string {
    const iconos = {
      info: 'hugeicons--information-circle',
      warning: 'hugeicons--alert-circle',
      success: 'hugeicons--checkmark-circle-02',
      error: 'hugeicons--cancel-circle',
    };
    return iconos[tipo as keyof typeof iconos] || 'hugeicons--information-circle';
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
      try {
        const element = this.chatContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      } catch (err) {
        console.error('Error al hacer scroll:', err);
      }
    }
  }

  onChatScroll() {
    if (this.chatContainer) {
      const element = this.chatContainer.nativeElement;
      const threshold = 150;
      this.isNearBottom =
        element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
    }
  }

  cerrarIndicaciones() {
    if (this.etapaDetails?.nativeElement) {
      this.etapaDetails.nativeElement.removeAttribute('open');
    }
  }

  toggleSonido() {
    this.sonidoHabilitado = !this.sonidoHabilitado;
  }

  // ============================================
  // GETTERS
  // ============================================

  get nombreCliente(): string {
    return this.estadoSimulacion?.escenario_cliente?.nombre || 'Cliente';
  }

  get avatarCliente(): string {
    return (
      this.estadoSimulacion?.escenario_cliente?.imagen || '/images/ilustraciones/perfil_default.png'
    );
  }

  get avatarAsesor(): string {
    return this.usuarioActual?.foto_perfil || '/images/ilustraciones/perfil_default.png';
  }

  get nombreAsesor(): string {
    if (this.usuarioActual) {
      return `${this.usuarioActual.nombres} ${this.usuarioActual.apellidos}`;
    }
    return 'Asesor';
  }

  get nombreEtapaActual(): string {
    return this.etapaActual?.nombre || 'Cargando...';
  }

  get objetivoEtapaActual(): string {
    return this.etapaActual?.objetivo || '';
  }

  get indiceEtapaActual(): number {
    return this.estadoSimulacion?.simulacion?.etapa_actual_index || 1;
  }

  get totalEtapas(): number {
    return this.estadoSimulacion?.simulacion?.total_etapas || 0;
  }

  get modoSimulacion(): string {
    const modo = this.estadoSimulacion?.simulacion?.modo;
    return modo === 'aprendizaje' ? 'Aprendizaje' : 'Evaluativo';
  }

  get esModoAprendizaje(): boolean {
    const modoLocal = this.estadoSimulacion?.simulacion?.modo;
    if (modoLocal) return modoLocal === 'aprendizaje';
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

  get configAnalisis() {
    const configs: any = {
      Excelente: {
        color: 'success',
        emoji: '🌟',
        bgClass: 'bg-success/10',
        textClass: 'text-success',
      },
      'Muy bueno': { color: 'info', emoji: '⭐', bgClass: 'bg-info/10', textClass: 'text-info' },
      Bueno: { color: 'primary', emoji: '👍', bgClass: 'bg-primary/10', textClass: 'text-primary' },
      Regular: {
        color: 'warning',
        emoji: '📊',
        bgClass: 'bg-warning/10',
        textClass: 'text-warning',
      },
      'Necesita mejorar': {
        color: 'error',
        emoji: '📈',
        bgClass: 'bg-error/10',
        textClass: 'text-error',
      },
    };

    const puntuacion = this.analisisDesempeno?.puntuacion_cualitativa || 'Bueno';
    return configs[puntuacion] || configs['Bueno'];
  }

  get mensajesPorEtapa(): { [key: number]: MensajeConversacion[] } {
    const grupos: { [key: number]: MensajeConversacion[] } = {};

    this.historialMensajes.forEach((mensaje) => {
      if (!grupos[mensaje.indiceEtapa]) {
        grupos[mensaje.indiceEtapa] = [];
      }
      grupos[mensaje.indiceEtapa].push(mensaje);
    });

    try {
      const idx = this.indiceEtapaActual;
      if (idx && !grupos[idx]) {
        grupos[idx] = [];
      }
    } catch (e) {
      // ignore
    }

    return grupos;
  }

  get indicesEtapas(): number[] {
    return Object.keys(this.mensajesPorEtapa)
      .map((key) => parseInt(key))
      .sort((a, b) => a - b);
  }

  onTextareaKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarMensaje();
    }
  }

  onTextareaCaretChange(event: any) {
    try {
      const ta = event.target as HTMLTextAreaElement;
      this.caretStart = typeof ta.selectionStart === 'number' ? ta.selectionStart : this.caretStart;
      this.caretEnd = typeof ta.selectionEnd === 'number' ? ta.selectionEnd : this.caretEnd;
    } catch (e) {
      // ignore
    }
  }
}
