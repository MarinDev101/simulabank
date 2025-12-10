import { Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  constructor(
    private titleService: Title,
    private metaService: Meta,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  initSeoTracking() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.activatedRoute),
        map((route) => {
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        mergeMap((route) => route.data)
      )
      .subscribe((data) => {
        this.updateMetaTags(data);
      });
  }

  private updateMetaTags(data: any) {
    // El título base
    const baseTitle = 'SimulaBank';
    // Si la ruta tiene título, lo usamos, si no, usamos uno por defecto
    const pageTitle = data.title || 'Simulador de asesorías bancarias';

    // Construimos el título completo para meta tags (Angular Router ya maneja el document.title si se configura)
    const fullTitle = `${baseTitle} | ${pageTitle}`;

    const description =
      data.description ||
      'SimulaBank es tu plataforma de simulación bancaria para practicar asesorías, mejorar habilidades financieras y ofrecer experiencias de clientes realistas.';
    const keywords =
      data.keywords ||
      'SimulaBank, simulador bancario, asesorías financieras, simulación de clientes, educación financiera';
    const image = data.image || 'https://simulabank.com/images/imagotipo/imagotipo_simulabank.png';
    const url = 'https://simulabank.com' + this.router.url;

    // Actualizar Meta Tags Generales
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ name: 'keywords', content: keywords });

    // Open Graph
    this.metaService.updateTag({ property: 'og:title', content: fullTitle });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:image', content: image });
    this.metaService.updateTag({ property: 'og:url', content: url });

    // Twitter Card
    this.metaService.updateTag({ name: 'twitter:title', content: fullTitle });
    this.metaService.updateTag({ name: 'twitter:description', content: description });
    this.metaService.updateTag({ name: 'twitter:image', content: image });
  }
}
