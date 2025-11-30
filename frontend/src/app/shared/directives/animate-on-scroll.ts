import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appAnimateOnScroll]',
  standalone: true,
})
export class AnimateOnScroll implements OnInit, OnDestroy {
  private el = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);
  private observer: IntersectionObserver | null = null;

  /**
   * Clase de animación de tailwindcss-animated a aplicar
   * Ejemplos: 'animate-fade-up', 'animate-fade-left', 'animate-fade-right', 'animate-zoom-in'
   */
  @Input() appAnimateOnScroll: string = 'animate-fade-up';

  /**
   * Retraso de la animación en milisegundos (se convierte a clase de delay)
   */
  @Input() animationDelay: number = 0;

  /**
   * Duración de la animación
   * Opciones: 'faster', 'fast', 'normal', 'slow', 'slower'
   */
  @Input() animationDuration: 'faster' | 'fast' | 'normal' | 'slow' | 'slower' = 'normal';

  /**
   * Umbral del viewport para activar la animación (0-1)
   */
  @Input() animationThreshold: number = 0.1;

  /**
   * Si la animación debe ejecutarse solo una vez
   */
  @Input() animationOnce: boolean = true;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const element = this.el.nativeElement as HTMLElement;

    // Aplicar estilos iniciales para ocultar el elemento
    element.style.opacity = '0';

    // Crear el Intersection Observer
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.applyAnimation(element);

            // Si solo debe ejecutarse una vez, dejar de observar
            if (this.animationOnce && this.observer) {
              this.observer.unobserve(element);
            }
          } else if (!this.animationOnce) {
            // Remover las clases si no está visible y puede repetirse
            this.removeAnimation(element);
          }
        });
      },
      {
        threshold: this.animationThreshold,
        rootMargin: '0px 0px -50px 0px', // Activar un poco antes de que sea completamente visible
      }
    );

    this.observer.observe(element);
  }

  private applyAnimation(element: HTMLElement): void {
    // Restaurar opacidad
    element.style.opacity = '1';

    // Aplicar la clase de animación principal
    if (this.appAnimateOnScroll) {
      element.classList.add(this.appAnimateOnScroll);
    }

    // Aplicar clase de duración
    if (this.animationDuration !== 'normal') {
      element.classList.add(`animate-duration-${this.animationDuration}`);
    }

    // Aplicar delay como clase personalizada
    if (this.animationDelay > 0) {
      const delayClass = this.getDelayClass(this.animationDelay);
      if (delayClass) {
        element.classList.add(delayClass);
      }
    }

    // Aplicar animate-once si es necesario
    if (this.animationOnce) {
      element.classList.add('animate-once');
    }

    // Aplicar ease-out para una animación más suave
    element.classList.add('animate-ease-out');
  }

  private removeAnimation(element: HTMLElement): void {
    element.style.opacity = '0';

    // Remover clases de animación
    const classesToRemove = [
      this.appAnimateOnScroll,
      'animate-once',
      'animate-ease-out',
      `animate-duration-${this.animationDuration}`,
    ];

    const delayClass = this.getDelayClass(this.animationDelay);
    if (delayClass) {
      classesToRemove.push(delayClass);
    }

    classesToRemove.forEach((cls) => {
      if (cls) element.classList.remove(cls);
    });
  }

  private getDelayClass(delay: number): string | null {
    // Mapear delays a las clases de tailwindcss-animated
    const delayMap: { [key: number]: string } = {
      75: 'animate-delay-75',
      100: 'animate-delay-100',
      150: 'animate-delay-150',
      200: 'animate-delay-200',
      300: 'animate-delay-300',
      400: 'animate-delay-[400ms]',
      500: 'animate-delay-500',
      600: 'animate-delay-[600ms]',
      700: 'animate-delay-700',
      800: 'animate-delay-[800ms]',
      1000: 'animate-delay-1000',
    };

    // Encontrar la clase más cercana
    const delays = Object.keys(delayMap).map(Number);
    const closest = delays.reduce((prev, curr) =>
      Math.abs(curr - delay) < Math.abs(prev - delay) ? curr : prev
    );

    return delayMap[closest] || null;
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
