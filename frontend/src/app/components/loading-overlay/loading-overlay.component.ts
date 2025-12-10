import { Component, inject } from '@angular/core';
import { LoadingService } from '../../services/loading/loading.service';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  template: `
    @if (loadingService.isLoading()) {
      <div class="loading-overlay">
        <div class="loading-backdrop"></div>
        <div class="loading-content">
          <div class="dots-loader">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 99998;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: all;
      animation: fadeIn 0.2s ease-out;
    }

    .loading-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    }

    :host-context(.dark) .loading-backdrop,
    :host-context([data-theme='dark']) .loading-backdrop {
      background: rgba(15, 15, 26, 0.85);
    }

    .loading-content {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    /* Loader de puntos moderno */
    .dots-loader {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: hsl(147, 100%, 39.2%); /* money-400 */
      animation: dotPulse 1.4s ease-in-out infinite;
    }

    .dot:nth-child(1) {
      animation-delay: 0s;
    }

    .dot:nth-child(2) {
      animation-delay: 0.2s;
      background-color: hsl(147, 100%, 32.2%); /* money-500 */
    }

    .dot:nth-child(3) {
      animation-delay: 0.4s;
      background-color: hsl(147, 100%, 25.3%); /* money-600 */
    }

    :host-context(.dark) .dot,
    :host-context([data-theme='dark']) .dot {
      background-color: hsl(147, 100%, 47.8%); /* money-200 */
    }

    :host-context(.dark) .dot:nth-child(2),
    :host-context([data-theme='dark']) .dot:nth-child(2) {
      background-color: hsl(147, 100%, 43.5%); /* money-300 */
    }

    :host-context(.dark) .dot:nth-child(3),
    :host-context([data-theme='dark']) .dot:nth-child(3) {
      background-color: hsl(147, 100%, 39.2%); /* money-400 */
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes dotPulse {
      0%,
      80%,
      100% {
        transform: scale(0.6);
        opacity: 0.5;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }
  `,
})
export class LoadingOverlayComponent {
  protected readonly loadingService = inject(LoadingService);
}
