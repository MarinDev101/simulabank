import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SimulacionService } from '@app/services/simulacion/simulacion';
import { SimuladorPlataformaComponent } from './../simulador-fases/simulador-plataforma/simulador-plataforma';
import { ConfiguracionSimulacionComponent } from '../simulador-fases/configuracion-simulacion/configuracion-simulacion';

@Component({
  selector: 'app-simulador',
  standalone: true,
  imports: [CommonModule, ConfiguracionSimulacionComponent, SimuladorPlataformaComponent],
  template: `
    <div class="h-[calc(100vh-65px)] w-full overflow-hidden sm:h-auto">
      @if (vistaActual === 'configuracion') {
        <app-configuracion-simulacion
          (onIniciarSimulacion)="manejarInicioSimulacion($event)"
          (onSimulacionExistente)="manejarSimulacionExistente($event)"
        />
      } @else if (vistaActual === 'simulacion') {
        <app-simulador-plataforma
          class="h-full w-full"
          [modoSoloLectura]="modoSoloLectura"
          (onRequestReturnToConfig)="manejarReturnToConfig()"
          (onRequestViewReadonly)="manejarViewReadonly()"
        />
      }
    </div>
  `,
})
export class Simulador implements OnInit, OnDestroy {
  vistaActual: 'configuracion' | 'simulacion' = 'configuracion';
  modoSoloLectura = false;
  private subscription = new Subscription();

  constructor(private simulacionService: SimulacionService) {}

  ngOnInit() {
    this.suscribirACambios();
  }

  private suscribirACambios() {
    // Suscribirse a cambios en el estado de simulación activa
    const sub = this.simulacionService.simulacionActiva$.subscribe((activa) => {
      // Solo cambiar a vista de simulación cuando se active.
      // NO volvemos automáticamente a la vista de configuración cuando la simulación
      // pasa a inactiva: el cambio a 'configuracion' debe hacerse explícitamente
      // por acción del usuario (botón "Finalizar" en el modal de análisis).
      if (activa && this.vistaActual === 'configuracion') {
        this.modoSoloLectura = false;
        this.vistaActual = 'simulacion';
      }
    });
    this.subscription.add(sub);
  }

  manejarInicioSimulacion(evento: any) {
    // La configuración ya inició la simulación, cambiar vista
    this.modoSoloLectura = false;
    this.vistaActual = 'simulacion';
  }

  manejarSimulacionExistente(evento: any) {
    // La configuración detectó una simulación activa, cambiar vista
    this.modoSoloLectura = false;
    this.vistaActual = 'simulacion';
  }

  manejarReturnToConfig() {
    // Limpiar modo solo lectura y volver al panel de configuración
    this.modoSoloLectura = false;
    this.vistaActual = 'configuracion';
  }

  manejarViewReadonly() {
    // Mostrar la vista de simulación pero deshabilitar interacciones
    this.modoSoloLectura = true;
    this.vistaActual = 'simulacion';
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
