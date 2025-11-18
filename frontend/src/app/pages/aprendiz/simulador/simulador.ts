import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
// import { SimulacionService } from './simulacion.service';
// import { ConfiguracionSimulacion } from './configuracion-simulacion';
// import { SimuladorPlataforma } from './simulador-plataforma';
import { SimulacionService } from '@app/services/simulacion/simulacion';
import { SimuladorPlataformaComponent } from './../simulador-fases/simulador-plataforma/simulador-plataforma';
import { ConfiguracionSimulacionComponent } from '../simulador-fases/configuracion-simulacion/configuracion-simulacion';

@Component({
  selector: 'app-simulador',
  standalone: true,
  imports: [CommonModule, ConfiguracionSimulacionComponent, SimuladorPlataformaComponent],
  template: `
    <div class="w-full">
      @if (vistaActual === 'configuracion') {
        <app-configuracion-simulacion (onIniciarSimulacion)="manejarInicioSimulacion($event)" />
      } @else if (vistaActual === 'simulacion') {
        <app-simulador-plataforma />
      }
    </div>
  `,
})
export class Simulador implements OnInit, OnDestroy {
  vistaActual: 'configuracion' | 'simulacion' = 'configuracion';
  private subscription = new Subscription();

  constructor(private simulacionService: SimulacionService) {}

  ngOnInit() {
    // Verificar si hay una simulación activa
    const sub = this.simulacionService.simulacionActiva$.subscribe((activa) => {
      if (activa) {
        this.vistaActual = 'simulacion';
      } else {
        this.vistaActual = 'configuracion';
      }
    });
    this.subscription.add(sub);
  }

  manejarInicioSimulacion(evento: any) {
    // La configuración ya inició la simulación, solo cambiar vista
    this.vistaActual = 'simulacion';
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
