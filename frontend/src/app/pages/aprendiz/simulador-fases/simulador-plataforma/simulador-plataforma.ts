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

interface MensajeSistema {
  tipo: 'info' | 'warning' | 'success' | 'error';
  mensaje: string;
  timestamp: Date;
}

@Component({
  selector: 'app-simulador-plataforma',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './simulador-plataforma.html',
  styleUrls: ['./simulador-plataforma.css'],
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

  // Datos de finalización
  datosFinalizacion: any = null;
  analisisDesempeno: AnalisisDesempeno | null = null;

  // Control de scroll
  private shouldScrollToBottom = false;
  private isNearBottom = true;

  // Reconocimiento de voz - CORREGIDO
  private recognition: any = null;
  grabandoVoz = false;
  // Control de sesión
  private dictadoSessionId = 0;
  private reconocimientoActivo = false;
  // Posición del cursor en el textarea
  private caretStart = 0;
  private caretEnd = 0;

  // Preview combinado
  get mensajePreview(): string {
    return this.mensajeAsesor || '';
  }

  onTextareaInput(event: any) {
    const value = event.target.value || '';
    this.mensajeAsesor = value;

    // Si el usuario borró el texto y el dictado ya no está presente,
    // limpiar el buffer temporal para evitar que reaparezca.
    try {
      // Actualizar posición del cursor
      const ta = event.target as HTMLTextAreaElement;
      this.caretStart = typeof ta.selectionStart === 'number' ? ta.selectionStart : 0;
      this.caretEnd = typeof ta.selectionEnd === 'number' ? ta.selectionEnd : this.caretStart;
    } catch (e) {
      console.warn('Error actualizando caret en onTextareaInput:', e);
    }
  }

  // Cola de audio
  private colaAudio: string[] = [];
  private reproduciendoAudio = false;

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
    private authService: AuthService
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
      speechSynthesis.cancel();
    }
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
        const prevIndex = this.estadoSimulacion?.simulacion?.etapa_actual_index || null;
        console.log('🔄 Estado actualizado desde servicio');
        try {
          console.log(
            '📥 Mensajes recibidos (muestra):',
            (estado.historial_conversacion || []).map((m) => ({
              emisor: m.emisor,
              receptor: m.receptor,
              text: m.mensaje?.slice(0, 60),
            }))
          );
        } catch (e) {
          console.warn('No se pudo imprimir muestra de mensajes del estado:', e);
        }
        this.actualizarEstadoLocal(estado);

        const newIndex = estado.simulacion?.etapa_actual_index || null;
        if (prevIndex !== null && newIndex !== null && prevIndex !== newIndex) {
          this.agregarMensajeSistema(
            'info',
            `➡ Se inició la etapa: ${estado.etapa_actual.nombre}`
          );

          if (estado.historial_conversacion && estado.historial_conversacion.length) {
            this.historialMensajes = estado.historial_conversacion;
          }
          this.etapaActual = estado.etapa_actual;
          this.shouldScrollToBottom = true;
        }
      }
    });
    this.subscriptions.add(sub);
  }

  private actualizarEstadoLocal(estado: EstadoSimulacion) {
    const mensajesAnteriores = this.historialMensajes.length;

    this.estadoSimulacion = estado;
    // CORRECCIÓN: Usar directamente el historial del servidor
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
  }

  // ============================================
  // RECONOCIMIENTO DE VOZ - COMPLETAMENTE REDISEÑADO
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
        // Construir el texto solo desde los resultados nuevos para esta llamada
        let textoCompleto = '';

        const startIndex = typeof event.resultIndex === 'number' ? event.resultIndex : 0;
        for (let i = startIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result && result[0] && result[0].transcript) {
            // Si es final, lo añadimos; si no, lo ignoramos (interim no se guarda en buffer permanente)
            if (result.isFinal) {
              textoCompleto += result[0].transcript + ' ';
            }
          }
        }

        // Insertar directamente el texto final en la posición del cursor
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
      // No transferimos nada aquí: las transcripciones ya se insertan en vivo
      this.agregarMensajeSistema('success', '✓ Dictado detenido');
    } catch (e) {
      console.warn('Error al detener reconocimiento:', e);
      this.reconocimientoActivo = false;
      this.grabandoVoz = false;
    }
  }

  /** Insertar texto en la posición actual del cursor dentro del textarea */
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

      // Asegurar espacios alrededor según contexto para evitar que las palabras se peguen
      let prefix = '';
      let suffix = '';

      if (before.length > 0 && !/\s$/.test(before)) {
        prefix = ' ';
      }

      if (after.length > 0 && !/^\s/.test(after)) {
        suffix = ' ';
      }

      // Si estamos insertando al final y no hay sufijo, añadimos espacio final
      if (after.length === 0 && suffix === '') {
        suffix = ' ';
      }

      // Insertar el texto ajustado con posibles espacios
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
      // Fallback: concatenar al final
      this.mensajeAsesor = (this.mensajeAsesor + ' ' + text).trim();
    }
  }

  // ============================================
  // REPRODUCCIÓN DE AUDIO
  // ============================================

  private agregarAudioACola(texto: string) {
    this.colaAudio.push(texto);
    if (!this.reproduciendoAudio) {
      this.reproducirSiguienteAudio();
    }
  }

  private reproducirSiguienteAudio() {
    if (this.colaAudio.length === 0) {
      this.reproduciendoAudio = false;
      return;
    }

    this.reproduciendoAudio = true;
    const texto = this.colaAudio.shift()!;

    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      utterance.pitch = 1;

      utterance.onend = () => {
        setTimeout(() => {
          this.reproducirSiguienteAudio();
        }, 500);
      };

      utterance.onerror = () => {
        console.error('Error al reproducir audio');
        this.reproducirSiguienteAudio();
      };

      speechSynthesis.speak(utterance);
    }
  }

  reproducirAudio(mensaje: string) {
    if (!this.sonidoHabilitado) return;

    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(mensaje);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      utterance.pitch = 1;

      speechSynthesis.speak(utterance);
    }
  }

  reproducirAudioManual(mensaje: string) {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(mensaje);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      utterance.pitch = 1;

      speechSynthesis.speak(utterance);
    }
  }

  // ============================================
  // ENVÍO DE MENSAJES - CORREGIDO
  // ============================================

  async enviarMensaje() {
    // Usar solo el contenido actual del textarea (las transcripciones se insertan en vivo)
    const mensaje = (this.mensajeAsesor || '').trim();

    // Si el micrófono está activo, detenerlo inmediatamente al enviar
    // Esto asegura que no se sigan acumulando resultados de voz después del envío
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
    // No mostrar que el asesor está "typing" en el chat. Después de enviar,
    // mostramos al cliente como escribiendo mientras esperamos la respuesta.
    this.indicadorEmisor = null;
    this.error = null;

    // Añadir el mensaje localmente para mostrarlo de forma optimista
    try {
      const mensajeLocal: MensajeConversacion = {
        indiceEtapa: this.indiceEtapaActual,
        totalEtapas: this.totalEtapas,
        nombreEtapa: this.nombreEtapaActual,
        objetivoEtapa: this.objetivoEtapaActual,
        // El emisor debe ser el Asesor (el usuario) y el receptor el Cliente
        emisor: 'Asesor',
        mensaje: mensaje,
        receptor: 'Cliente',
      };

      this.historialMensajes = [...this.historialMensajes, mensajeLocal];
      this.shouldScrollToBottom = true;
    } catch (e) {
      console.warn('No se pudo añadir mensaje localmente:', e);
    }

    // Limpiar input (el dictado ya se insertó directamente en mensajeAsesor)
    this.mensajeAsesor = '';

    console.log('📤 Enviando mensaje:', mensaje);

    try {
      const enviarObservable = await this.simulacionService.enviarMensaje(mensaje);

      const sub = enviarObservable.subscribe({
        next: (response) => {
          console.log('✅ Respuesta recibida:', response);
          try {
            console.log(
              '📥 Historial desde servidor (muestra):',
              (response.historialActualizado || []).map((m) => ({
                emisor: m.emisor,
                receptor: m.receptor,
                text: m.mensaje?.slice(0, 60),
              }))
            );
          } catch (e) {
            console.warn('No se pudo imprimir historial actualizado:', e);
          }

          this.enviandoMensaje = false;
          this.mostrarIndicadorEscritura = false;
          this.indicadorEmisor = null;

          // CORRECCIÓN: Usar el historial del servidor directamente (sin deduplicar)
          if (response.historialActualizado && Array.isArray(response.historialActualizado)) {
            this.historialMensajes = response.historialActualizado;
          }

          // Reproducir audio si está habilitado
          const textoAudio = response.mensajes?.cliente?.mensaje || response.mensaje || '';
          if (this.sonidoHabilitado && textoAudio) {
            setTimeout(() => {
              this.agregarAudioACola(textoAudio);
            }, 500);
          }

          // Actualizar etapa si cambió
          if (response.nueva_etapa) {
            this.etapaActual = response.nueva_etapa;

            if (response.etapa_cambiada) {
              this.agregarMensajeSistema(
                'success',
                `✓ Has avanzado a la siguiente etapa: ${response.nueva_etapa.nombre}`
              );
            }
          }

          // Verificar finalización
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

          // Restaurar el mensaje en el textarea
          this.mensajeAsesor = mensaje;

          this.agregarMensajeSistema(
            'error',
            'Error al enviar el mensaje. Por favor, intenta nuevamente.'
          );
        },
      });

      this.subscriptions.add(sub);

      // Indicador: el cliente (simulado) comienza a "escribir" mientras procesamos la respuesta
      // Esto evita que parezca que tú (Asesor) estás escribiendo después de enviar.
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
      this.estadoSimulacion?.escenario_cliente?.imagen ||
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop'
    );
  }

  get avatarAsesor(): string {
    return (
      this.usuarioActual?.foto_perfil ||
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop'
    );
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
