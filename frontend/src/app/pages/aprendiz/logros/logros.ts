import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Estadisticas, Logro } from '@app/services/estadisticas/estadisticas';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-logros',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logros.html',
})
export class Logros implements OnInit {
  logrosPlataforma: Logro[] = [];
  private logrosAprendizIds: Set<number> = new Set();

  constructor(private estadisticasService: Estadisticas) {}

  ngOnInit(): void {
    this.cargarLogros();
  }

  private cargarLogros(): void {
    // Cargar ambos en paralelo para mejor rendimiento
    forkJoin({
      plataforma: this.estadisticasService.obtenerLogrosPlataforma(),
      aprendiz: this.estadisticasService.obtenerLogrosAprendiz(),
    }).subscribe({
      next: ({ plataforma, aprendiz }) => {
        this.logrosPlataforma = plataforma;
        // Guardar los IDs de los logros que tiene el aprendiz
        this.logrosAprendizIds = new Set(aprendiz.map((l) => l.id_logro));
      },
      error: (err) => {
        console.error('Error obteniendo logros', err);
      },
    });
  }

  /**
   * Verifica si el aprendiz tiene un logro específico
   */
  tieneLogro(idLogro: number): boolean {
    return this.logrosAprendizIds.has(idLogro);
  }
}
