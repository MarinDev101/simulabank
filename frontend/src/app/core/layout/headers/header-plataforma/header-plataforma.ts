import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-header-plataforma',
  standalone: true,
  imports: [],
  templateUrl: './header-plataforma.html',
})
export class HeaderPlataforma implements OnInit, OnDestroy {
  headerText = 'SimulaBank';
  private sub?: Subscription;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.sub = this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.updateHeaderText();
    });

    // inicializar inmediatamente
    this.updateHeaderText();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private updateHeaderText(): void {
    try {
      let route = this.activatedRoute;
      while (route.firstChild) {
        route = route.firstChild;
      }

      // Prefer `data.headerText` when provided, otherwise fall back to `data.title`
      const headerData = route.snapshot.data?.['headerText'] ?? route.snapshot.data?.['title'];
      if (headerData) {
        this.headerText = headerData as string;
        return;
      }

      // Fallback: usar la última parte de la URL y formatearla
      const parts = this.router.url.split('/').filter(Boolean);
      if (parts.length === 0) {
        this.headerText = 'Inicio';
        return;
      }

      const last = parts[parts.length - 1];
      this.headerText = this.humanizePathSegment(last);
    } catch {
      this.headerText = 'SimulaBank';
    }
  }

  private humanizePathSegment(seg: string): string {
    // Mapeo de rutas a nombres legibles
    const routeNames: Record<string, string> = {
      'inicio': 'Inicio',
      'simulador': 'Simulación',
      'mi-personal': 'Mi Personal',
      'politicas': 'Políticas del Banco',
      'informacion': 'Información',
      'logros': 'Logros',
      'configuracion': 'Configuración',
      'aprendices': 'Aprendices',
      'administrador': 'Panel de Administrador',
      'instructor': 'Panel de Instructor',
      'aprendiz': 'Panel de Aprendiz'
    };

    // Buscar en el mapeo primero
    const lowerSeg = seg.toLowerCase();
    if (routeNames[lowerSeg]) {
      return routeNames[lowerSeg];
    }

    // Reemplaza guiones y camelCase simple por espacios y capitaliza
    const s = seg.replace(/[-_]/g, ' ');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
