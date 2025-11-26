import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Estadisticas, Logro } from '@app/services/estadisticas/estadisticas';

@Component({
  selector: 'app-logros',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logros.html',
})
export class Logros implements OnInit {
  logrosPlataforma: Logro[] = [];

  constructor(private estadisticasService: Estadisticas) {}

  ngOnInit(): void {
    this.cargarLogrosPlataforma();
  }

  private cargarLogrosPlataforma(): void {
    this.estadisticasService.obtenerLogrosPlataforma().subscribe({
      next: (logros) => {
        this.logrosPlataforma = logros;
      },
      error: (err) => {
        console.error('Error obteniendo logros de la plataforma', err);
      },
    });
  }
}
