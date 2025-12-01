import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SimulacionService, ConfiguracionSimulacion } from '@app/services/simulacion/simulacion';
import { AlertService } from '@app/services/alert/alert.service';

@Component({
  selector: 'app-configuracion-simulacion',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './configuracion-simulacion.html',
})
export class ConfiguracionSimulacionComponent implements OnInit, OnDestroy {
  @Output() onIniciarSimulacion = new EventEmitter<any>();
  @Output() onSimulacionExistente = new EventEmitter<any>();

  datosFormulario = {
    producto: '',
    modo: '',
    destino: 'personal',
    interaccion: '',
  };

  cargando = false;
  verificandoSimulacion = true;

  private subscriptions = new Subscription();
  private productosCaptacion = ['cuenta_ahorros', 'cuenta_corriente', 'cdt_digital'];
  private productosColocacion = [
    'credito_libre_inversion',
    'credito_educativo_educaplus',
    'credito_rotativo_empresarial',
  ];

  constructor(
    private simulacionService: SimulacionService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    // Verificar si hay simulación activa al cargar el componente
    this.verificarSimulacionActiva();

    // Suscribirse a cambios en el estado de simulación
    const sub = this.simulacionService.simulacionActiva$.subscribe((activa) => {
      if (activa && this.verificandoSimulacion) {
        // Si detecta simulación activa mientras estaba verificando
        console.log('✅ Simulación activa detectada desde observable');
        const estado = this.simulacionService.obtenerEstadoActual();
        if (estado) {
          this.verificandoSimulacion = false;
          this.onSimulacionExistente.emit(estado);
        }
      }
    });
    this.subscriptions.add(sub);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  /**
   * Verifica si hay una simulación activa
   * Primero revisa localStorage, luego el servidor
   */
  private verificarSimulacionActiva() {
    console.log('🔍 Verificando si hay simulación activa...');

    // 1. Revisar primero el estado local (instantáneo)
    const estadoLocal = this.simulacionService.obtenerEstadoActual();

    if (estadoLocal) {
      console.log('✅ Simulación activa encontrada en localStorage');
      this.verificandoSimulacion = false;
      this.onSimulacionExistente.emit(estadoLocal);
      return;
    }

    // 2. Si no hay estado local, verificar con el servidor
    console.log('🌐 Verificando con servidor...');
    this.verificandoSimulacion = true;

    const sub = this.simulacionService.verificarSimulacionEnServidor().subscribe({
      next: (estado) => {
        console.log('✅ Simulación activa encontrada en servidor:', estado);
        this.verificandoSimulacion = false;
        this.onSimulacionExistente.emit(estado);
      },
      error: (error) => {
        console.log('ℹ️ No hay simulación activa (esperado si no hay simulación)');
        this.verificandoSimulacion = false;
        // No mostrar error - es normal no tener simulación activa
      },
    });

    this.subscriptions.add(sub);
  }

  /**
   * Selecciona un producto aleatorio según la categoría
   */
  private seleccionarProductoAleatorio(categoria: string): string {
    let productos: string[] = [];

    switch (categoria) {
      case 'todos-productos':
        productos = [...this.productosCaptacion, ...this.productosColocacion];
        break;
      case 'productos-captacion':
        productos = this.productosCaptacion;
        break;
      case 'productos-colocacion':
        productos = this.productosColocacion;
        break;
      default:
        return categoria;
    }

    const indiceAleatorio = Math.floor(Math.random() * productos.length);
    return productos[indiceAleatorio];
  }

  /**
   * Envía el formulario para iniciar una nueva simulación
   */
  async enviarFormulario(form: NgForm) {
    if (!form.valid) {
      return;
    }

    this.cargando = true;

    try {
      // Crear configuración
      const configuracion: ConfiguracionSimulacion = {
        producto: this.seleccionarProductoAleatorio(this.datosFormulario.producto) as any,
        modo: this.datosFormulario.modo as 'aprendizaje' | 'evaluativo',
        destino: this.datosFormulario.destino as 'personal' | 'sala',
        interaccion: this.datosFormulario.interaccion as 'automatico' | 'manual',
      };

      console.log('🚀 Iniciando simulación con:', configuracion);

      // Iniciar simulación
      const iniciarObservable = await this.simulacionService.iniciarSimulacion(configuracion);

      const sub = iniciarObservable.subscribe({
        next: (response) => {
          console.log('✅ Simulación iniciada exitosamente:', response);
          this.cargando = false;
          this.onIniciarSimulacion.emit(response);
        },
        error: (error) => {
          console.error('❌ Error al iniciar simulación:', error);
          this.cargando = false;

          // Manejar específicamente el error 429
          if (error.status === 429) {
            this.alertService.warning(
              'Demasiadas solicitudes',
              'Por favor, espera un momento e intenta nuevamente.'
            );
          } else {
            this.alertService.error(
              'Error',
              error.error?.mensaje || 'Error al iniciar la simulación'
            );
          }
        },
      });

      this.subscriptions.add(sub);
    } catch (error: any) {
      console.error('❌ Error al iniciar simulación:', error);
      this.cargando = false;
      this.alertService.error('Error', 'Error inesperado al iniciar la simulación');
    }
  }
}
