import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loadingCount = signal(0);
  private showDelayed = signal(false);
  private showTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Delay antes de mostrar el loader (evita parpadeos en peticiones rápidas)
   * Si la petición tarda menos de este tiempo, el loader nunca se muestra
   */
  private readonly showDelay = 200; // ms

  /** Tiempo mínimo que el loader permanece visible una vez mostrado */
  private readonly minimumDisplayTime = 400; // ms
  private loadingStartTime = 0;

  /** Signal reactivo para mostrar/ocultar el loader */
  readonly isLoading = computed(() => this.loadingCount() > 0 && this.showDelayed());

  /**
   * Muestra el loader (incrementa el contador)
   * El loader solo se muestra después de un delay para evitar parpadeos
   */
  show(): void {
    const wasInactive = this.loadingCount() === 0;
    this.loadingCount.update((count) => count + 1);

    if (wasInactive) {
      // Iniciar timeout para mostrar el loader
      this.showTimeout = setTimeout(() => {
        if (this.loadingCount() > 0) {
          this.showDelayed.set(true);
          this.loadingStartTime = Date.now();
        }
      }, this.showDelay);
    }
  }

  /**
   * Oculta el loader (decrementa el contador)
   * Respeta el tiempo mínimo de visualización si el loader ya se mostró
   */
  hide(): void {
    this.loadingCount.update((count) => Math.max(0, count - 1));

    if (this.loadingCount() === 0) {
      // Cancelar el timeout si la petición terminó antes del delay
      if (this.showTimeout) {
        clearTimeout(this.showTimeout);
        this.showTimeout = null;
      }

      if (this.showDelayed()) {
        // El loader se mostró, respetar tiempo mínimo
        const elapsed = Date.now() - this.loadingStartTime;
        const remaining = Math.max(0, this.minimumDisplayTime - elapsed);

        setTimeout(() => {
          this.showDelayed.set(false);
        }, remaining);
      }
    }
  }

  /**
   * Fuerza ocultar el loader inmediatamente
   */
  forceHide(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    this.showDelayed.set(false);
    this.loadingCount.set(0);
  }

  /**
   * Ejecuta una promesa mostrando el loader
   */
  async withLoading<T>(promise: Promise<T>): Promise<T> {
    this.show();
    try {
      return await promise;
    } finally {
      this.hide();
    }
  }
}
