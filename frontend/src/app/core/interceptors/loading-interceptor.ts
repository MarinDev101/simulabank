import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../../services/loading/loading.service';

/**
 * Interceptor que muestra/oculta automáticamente el loader durante peticiones HTTP
 *
 * Para excluir una petición del loader, agregar el header 'X-Skip-Loading: true'
 * Ejemplo: this.http.get(url, { headers: { 'X-Skip-Loading': 'true' } })
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Verificar si la petición debe saltar el loader
  const skipLoading = req.headers.has('X-Skip-Loading');

  if (skipLoading) {
    // Remover el header personalizado antes de enviar la petición
    const cleanReq = req.clone({
      headers: req.headers.delete('X-Skip-Loading'),
    });
    return next(cleanReq);
  }

  // Mostrar el loader
  loadingService.show();

  return next(req).pipe(
    finalize(() => {
      // Ocultar el loader cuando la petición termine (éxito o error)
      loadingService.hide();
    })
  );
};
