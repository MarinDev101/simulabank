import { Injectable, inject } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

/**
 * Estrategia de preloading inteligente que:
 * 1. Precarga módulos marcados con data.preload = true inmediatamente
 * 2. Precarga el resto de módulos después de un delay configurable
 * 3. Respeta data.preload = false para nunca precargar
 */
@Injectable({
  providedIn: 'root',
})
export class SmartPreloadingStrategy implements PreloadingStrategy {
  private readonly defaultDelay = 2000; // 2 segundos después del bootstrap

  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    // Si explícitamente se marca como no precargar
    if (route.data?.['preload'] === false) {
      return of(null);
    }

    // Si se marca como precargar inmediatamente
    if (route.data?.['preload'] === true) {
      return load();
    }

    // Por defecto, precargar después del delay
    const delay = route.data?.['preloadDelay'] ?? this.defaultDelay;

    return timer(delay).pipe(mergeMap(() => load()));
  }
}
