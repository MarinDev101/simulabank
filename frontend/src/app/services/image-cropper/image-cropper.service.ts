import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';
import { ImageCroppedEvent, OutputFormat } from 'ngx-image-cropper';

export interface CropperConfig {
  aspectRatio?: number;
  resizeToWidth?: number;
  resizeToHeight?: number;
  cropperMinWidth?: number;
  cropperMinHeight?: number;
  format?: OutputFormat;
  quality?: number;
  roundCropper?: boolean;
  title?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  showPreview?: boolean;
  previewSize?: number;
}

export interface CropResult {
  base64: string;
  blob: Blob;
  file: File;
  width: number;
  height: number;
}

interface CropperState {
  scale: number;
  minScale: number;
  maxScale: number;
  translateX: number;
  translateY: number;
  isDragging: boolean;
  startX: number;
  startY: number;
  startTranslateX: number;
  startTranslateY: number;
  lastPinchDistance: number;
  lastPinchScale: number;
  imageWidth: number;
  imageHeight: number;
  containerWidth: number;
  containerHeight: number;
  cropWidth: number;
  cropHeight: number;
}

/**
 * Servicio optimizado para recortar imágenes con precisión y soporte responsive.
 * Utiliza canvas nativo y requestAnimationFrame para máximo rendimiento.
 */
@Injectable({
  providedIn: 'root',
})
export class ImageCropperService {
  private cleanupFunctions: (() => void)[] = [];

  /**
   * Detecta si el modo oscuro está activo
   */
  private isDarkMode(): boolean {
    if (typeof document === 'undefined') return false;
    const html = document.documentElement;
    return html.classList.contains('dark') || html.getAttribute('data-theme') === 'dark';
  }

  private getTheme(): 'dark' | 'light' {
    return this.isDarkMode() ? 'dark' : 'light';
  }

  /**
   * Limpia recursos al cerrar el modal
   */
  private cleanup(): void {
    this.cleanupFunctions.forEach(fn => fn());
    this.cleanupFunctions = [];
  }

  /**
   * Abre un modal con el cropper de imágenes optimizado
   */
  async openCropper(imageFile: File, config: CropperConfig = {}): Promise<CropResult | null> {
    const finalConfig: Required<CropperConfig> = {
      aspectRatio: config.aspectRatio ?? 1,
      resizeToWidth: config.resizeToWidth ?? 400,
      resizeToHeight: config.resizeToHeight ?? 400,
      cropperMinWidth: config.cropperMinWidth ?? 50,
      cropperMinHeight: config.cropperMinHeight ?? 50,
      format: config.format ?? 'png',
      quality: config.quality ?? 95,
      roundCropper: config.roundCropper ?? true,
      title: config.title ?? 'Recortar imagen',
      confirmButtonText: config.confirmButtonText ?? 'Aplicar recorte',
      cancelButtonText: config.cancelButtonText ?? 'Cancelar',
      showPreview: config.showPreview ?? true,
      previewSize: config.previewSize ?? 100,
    };

    const imageBase64 = await this.fileToBase64(imageFile);
    const isDark = this.isDarkMode();
    const modalWidth = Math.min(700, window.innerWidth - (window.innerWidth < 768 ? 32 : 100));

    return new Promise((resolve) => {
      let croppedImageData: ImageCroppedEvent | null = null;

      const swalContent = document.createElement('div');
      swalContent.innerHTML = `
        <style>${this.createStyles(isDark, finalConfig.roundCropper)}</style>
        <div class="cropper-main-container">
          <div class="cropper-workspace">
            ${finalConfig.showPreview ? `
            <div class="cropper-preview-panel">
              <div class="cropper-preview-title">Vista previa</div>
              <div class="cropper-preview-container">
                <div class="cropper-preview-item">
                  <div class="cropper-preview-image" id="preview-main"></div>
                </div>
              </div>
            </div>` : ''}
            <div class="cropper-canvas-wrapper" id="cropper-wrapper">
              <div class="cropper-loading" id="cropper-loading">
                <div class="cropper-spinner"></div>
                <p>Cargando imagen...</p>
              </div>
            </div>
          </div>
          <div class="cropper-controls">
            <div class="cropper-zoom-controls">
              <button type="button" class="cropper-btn" id="zoom-out" title="Reducir">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/><line x1="8" y1="11" x2="14" y2="11"/>
                </svg>
              </button>
              <input type="range" id="zoom-slider" min="100" max="400" value="100" class="cropper-slider">
              <button type="button" class="cropper-btn" id="zoom-in" title="Ampliar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;

      Swal.fire({
        theme: this.getTheme(),
        title: finalConfig.title,
        html: swalContent,
        width: modalWidth,
        showCancelButton: true,
        confirmButtonText: finalConfig.confirmButtonText,
        cancelButtonText: finalConfig.cancelButtonText,
        confirmButtonColor: '#00A448',
        cancelButtonColor: '#6b7280',
        reverseButtons: true,
        allowOutsideClick: false,
        allowEscapeKey: true,
        customClass: {
          popup: 'cropper-swal-popup',
          htmlContainer: 'cropper-swal-container',
        },
        didOpen: () => {
          const wrapper = document.getElementById('cropper-wrapper');
          const loading = document.getElementById('cropper-loading');
          if (wrapper) {
            this.initializeCropper(wrapper, imageBase64, finalConfig,
              (result) => { croppedImageData = result; },
              () => { if (loading) loading.style.display = 'none'; }
            );
          }
        },
        willClose: () => this.cleanup(),
        preConfirm: () => {
          if (!croppedImageData?.base64) {
            Swal.showValidationMessage('Por favor, espera a que se cargue la imagen');
            return false;
          }
          return croppedImageData;
        },
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          const event = result.value as ImageCroppedEvent;
          const base64 = event.base64 || '';
          const blob = event.blob || this.base64ToBlob(base64, `image/${finalConfig.format}`);
          resolve({
            base64,
            blob,
            file: new File([blob], `cropped-image.${finalConfig.format}`, { type: `image/${finalConfig.format}` }),
            width: event.width || finalConfig.resizeToWidth,
            height: event.height || finalConfig.resizeToHeight,
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Crea los estilos CSS optimizados para el cropper
   */
  private createStyles(isDark: boolean, roundCropper: boolean): string {
    const colors = {
      bg: isDark ? '#1f2937' : '#f3f4f6',
      text: isDark ? '#9ca3af' : '#6b7280',
      border: isDark ? '#374151' : '#e5e7eb',
      btnBg: isDark ? '#374151' : '#ffffff',
      btnHover: isDark ? '#4b5563' : '#f9fafb',
      panelBg: isDark ? '#111827' : '#ffffff',
      overlay: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.55)',
    };
    const borderRadius = roundCropper ? '50%' : '4px';

    return `
      .cropper-main-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        padding: 8px 0;
        width: 100%;
        max-width: 400px;
        margin: 0 auto;
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
      }

      /* Siempre apilado verticalmente */
      .cropper-workspace {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        width: 100%;
      }

      /* Preview arriba */
      .cropper-preview-panel {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 16px;
        padding: 12px 20px;
        background: ${colors.panelBg};
        border-radius: 14px;
        border: 1px solid ${colors.border};
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        width: 100%;
        max-width: 320px;
      }

      .cropper-preview-title {
        font-size: 11px;
        font-weight: 600;
        color: ${colors.text};
        letter-spacing: 0.3px;
        text-transform: uppercase;
        opacity: 0.85;
        white-space: nowrap;
        padding-right: 16px;
        border-right: 1px solid ${colors.border};
      }

      .cropper-preview-container {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .cropper-preview-image {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        overflow: hidden;
        background: ${colors.bg};
        background-size: cover;
        background-position: center;
        border: 2.5px solid ${colors.border};
        box-shadow: 0 3px 10px rgba(0,0,0,0.12);
      }

      /* Área de recorte - alineada con preview y controles */
      .cropper-canvas-wrapper {
        position: relative;
        width: 100%;
        max-width: 320px;
        aspect-ratio: 1;
        background: ${colors.bg};
        border-radius: 14px;
        overflow: hidden;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        box-shadow: inset 0 2px 8px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08);
        border: 1px solid ${colors.border};
      }

      .cropper-loading {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        color: ${colors.text};
        z-index: 100;
        background: ${colors.bg};
      }

      .cropper-spinner {
        width: 36px;
        height: 36px;
        border: 3px solid ${colors.border};
        border-top-color: #00A448;
        border-radius: 50%;
        animation: cropper-spin 0.8s linear infinite;
      }

      @keyframes cropper-spin { to { transform: rotate(360deg); } }

      .cropper-image-container {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: grab;
        overflow: hidden;
      }

      .cropper-image-container:active { cursor: grabbing; }

      .cropper-image {
        max-width: none;
        max-height: none;
        transform-origin: center center;
        pointer-events: none;
        will-change: transform;
        backface-visibility: hidden;
      }

      .cropper-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 10;
      }

      .cropper-crop-area {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        border: 2.5px solid #00A448;
        border-radius: ${borderRadius};
        box-shadow: 0 0 0 9999px ${colors.overlay};
      }

      .cropper-crop-area::before {
        content: '';
        position: absolute;
        inset: -1px;
        border: 1px dashed rgba(255,255,255,0.4);
        border-radius: ${borderRadius};
      }

      .cropper-crop-area::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 6px;
        height: 6px;
        background: rgba(255,255,255,0.5);
        border-radius: 50%;
        transform: translate(-50%, -50%);
      }

      .cropper-grid {
        position: absolute;
        inset: 2px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
        opacity: 0.4;
        ${roundCropper ? 'border-radius: 50%; overflow: hidden;' : ''}
      }

      .cropper-grid span {
        border-right: 1px solid rgba(255,255,255,0.3);
        border-bottom: 1px solid rgba(255,255,255,0.3);
      }

      .cropper-grid span:nth-child(3n) { border-right: none; }
      .cropper-grid span:nth-child(n+7) { border-bottom: none; }

      /* Controles de zoom abajo */
      .cropper-controls {
        display: flex;
        justify-content: center;
        width: 100%;
        padding: 0 8px;
      }

      .cropper-zoom-controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 10px 16px;
        background: ${colors.bg};
        border-radius: 12px;
        border: 1px solid ${colors.border};
        box-shadow: 0 2px 6px rgba(0,0,0,0.06);
        width: 100%;
        max-width: 320px;
      }



      .cropper-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        padding: 0;
        background: ${colors.btnBg};
        border: 1px solid ${colors.border};
        border-radius: 10px;
        color: ${colors.text};
        cursor: pointer;
        transition: all 0.15s ease;
        flex-shrink: 0;
      }

      .cropper-btn:hover {
        background: ${colors.btnHover};
        color: #00A448;
        border-color: #00A448;
      }

      .cropper-btn:active { transform: scale(0.94); }

      .cropper-slider {
        flex: 1;
        max-width: 140px;
        height: 6px;
        -webkit-appearance: none;
        appearance: none;
        background: ${colors.border};
        border-radius: 3px;
        outline: none;
        cursor: pointer;
      }

      .cropper-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 20px;
        height: 20px;
        background: #00A448;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        transition: transform 0.15s ease;
      }

      .cropper-slider::-webkit-slider-thumb:hover {
        transform: scale(1.1);
      }

      .cropper-slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        background: #00A448;
        border-radius: 50%;
        cursor: pointer;
        border: none;
      }

      /* Modal SweetAlert */
      .cropper-swal-popup {
        padding: 20px !important;
        max-width: min(440px, calc(100vw - 24px)) !important;
        border-radius: 18px !important;
      }

      .cropper-swal-container {
        margin: 0 !important;
        padding: 0 !important;
      }

      .cropper-swal-popup .swal2-title {
        font-size: 1.2em !important;
        margin-bottom: 12px !important;
      }

      .cropper-swal-popup .swal2-actions {
        gap: 10px !important;
        margin-top: 12px !important;
      }

      .cropper-swal-popup .swal2-actions button {
        font-size: 14px !important;
        padding: 10px 20px !important;
        border-radius: 10px !important;
        min-height: 42px !important;
      }

      /* Ajustes para pantallas pequeñas */
      @media (max-width: 400px) {
        .cropper-main-container { gap: 12px; padding: 4px 0; }
        .cropper-preview-panel {
          max-width: calc(100vw - 48px);
          padding: 10px 16px;
          gap: 12px;
          border-radius: 12px;
        }
        .cropper-preview-title { font-size: 10px; padding-right: 12px; }
        .cropper-preview-image { width: 60px; height: 60px; border-width: 2px; }
        .cropper-canvas-wrapper {
          max-width: calc(100vw - 48px);
          border-radius: 12px;
        }
        .cropper-zoom-controls {
          max-width: calc(100vw - 48px);
          padding: 8px 12px;
          gap: 10px;
          border-radius: 10px;
        }
        .cropper-btn { width: 38px; height: 38px; border-radius: 8px; }
        .cropper-btn svg { width: 18px; height: 18px; }
        .cropper-slider { max-width: 100px; }
        .cropper-slider::-webkit-slider-thumb { width: 18px; height: 18px; }
        .cropper-slider::-moz-range-thumb { width: 18px; height: 18px; }

        .cropper-swal-popup {
          padding: 16px !important;
          border-radius: 14px !important;
          max-width: calc(100vw - 16px) !important;
        }
        .cropper-swal-popup .swal2-title { font-size: 1.1em !important; }
        .cropper-swal-popup .swal2-actions button {
          padding: 10px 16px !important;
          min-height: 40px !important;
        }
      }

      /* Pantallas muy pequeñas */
      @media (max-width: 340px) {
        .cropper-main-container { gap: 10px; }
        .cropper-preview-panel { padding: 8px 12px; gap: 10px; }
        .cropper-preview-title { font-size: 9px; padding-right: 10px; }
        .cropper-preview-image { width: 52px; height: 52px; }
        .cropper-zoom-controls { padding: 6px 10px; gap: 8px; }
        .cropper-btn { width: 36px; height: 36px; }
        .cropper-slider { max-width: 80px; height: 5px; }

        .cropper-swal-popup { padding: 12px !important; }
        .cropper-swal-popup .swal2-actions {
          flex-direction: column !important;
          width: 100% !important;
        }
        .cropper-swal-popup .swal2-actions button {
          width: 100% !important;
          margin: 0 !important;
        }
      }

      /* Mejoras táctiles */
      @media (hover: none) and (pointer: coarse) {
        .cropper-btn { min-width: 44px; min-height: 44px; }
        .cropper-slider::-webkit-slider-thumb { width: 24px; height: 24px; }
        .cropper-slider::-moz-range-thumb { width: 24px; height: 24px; }
        .cropper-image-container { cursor: default; }
        .cropper-image-container:active { cursor: default; }
      }
    `;
  }

  /**
   * Inicializa el cropper con lógica de interacción simple y directa
   */
  private initializeCropper(
    container: HTMLElement,
    imageBase64: string,
    config: Required<CropperConfig>,
    onCrop: (result: ImageCroppedEvent) => void,
    onLoad: () => void
  ): void {
    const isDark = this.isDarkMode();
    const { aspectRatio } = config;

    const state: CropperState = {
      scale: 1, minScale: 0.5, maxScale: 4,
      translateX: 0, translateY: 0,
      isDragging: false, startX: 0, startY: 0,
      startTranslateX: 0, startTranslateY: 0,
      lastPinchDistance: 0, lastPinchScale: 1,
      imageWidth: 0, imageHeight: 0,
      containerWidth: 0, containerHeight: 0,
      cropWidth: 0, cropHeight: 0,
    };

    // Crear elementos del DOM
    const imageContainer = document.createElement('div');
    imageContainer.className = 'cropper-image-container';

    const img = document.createElement('img');
    img.className = 'cropper-image';
    img.crossOrigin = 'anonymous';

    const overlay = document.createElement('div');
    overlay.className = 'cropper-overlay';

    const cropArea = document.createElement('div');
    cropArea.className = 'cropper-crop-area';

    const grid = document.createElement('div');
    grid.className = 'cropper-grid';
    grid.innerHTML = '<span></span>'.repeat(9);
    cropArea.appendChild(grid);

    overlay.appendChild(cropArea);
    imageContainer.appendChild(img);
    container.appendChild(imageContainer);
    container.appendChild(overlay);

    // Referencias a controles
    const zoomSlider = document.getElementById('zoom-slider') as HTMLInputElement;
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const previewElement = document.getElementById('preview-main');

    // Canvas reutilizable
    const cropCanvas = document.createElement('canvas');
    const cropCtx = cropCanvas.getContext('2d', { alpha: true })!;

    const updateTransform = (): void => {
      img.style.transform = `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`;
    };

    const constrainPosition = (): void => {
      const scaledWidth = state.imageWidth * state.scale;
      const scaledHeight = state.imageHeight * state.scale;
      const maxX = Math.max(0, (scaledWidth - state.cropWidth) / 2);
      const maxY = Math.max(0, (scaledHeight - state.cropHeight) / 2);
      state.translateX = Math.max(-maxX, Math.min(maxX, state.translateX));
      state.translateY = Math.max(-maxY, Math.min(maxY, state.translateY));
    };

    const performCrop = (): void => {
      const outputSize = config.resizeToWidth;
      const outputHeight = Math.round(outputSize / aspectRatio);

      cropCanvas.width = outputSize;
      cropCanvas.height = outputHeight;

      cropCtx.imageSmoothingEnabled = true;
      cropCtx.imageSmoothingQuality = 'high';
      cropCtx.clearRect(0, 0, outputSize, outputHeight);

      if (config.roundCropper) {
        cropCtx.beginPath();
        cropCtx.arc(outputSize / 2, outputHeight / 2, Math.min(outputSize, outputHeight) / 2, 0, Math.PI * 2);
        cropCtx.closePath();
        cropCtx.clip();
      }

      const scaleToOutput = outputSize / state.cropWidth;

      cropCtx.save();
      cropCtx.translate(outputSize / 2, outputHeight / 2);
      cropCtx.scale(state.scale * scaleToOutput, state.scale * scaleToOutput);

      const imgX = -state.imageWidth / 2 + state.translateX / state.scale;
      const imgY = -state.imageHeight / 2 + state.translateY / state.scale;
      cropCtx.drawImage(img, imgX, imgY);
      cropCtx.restore();

      const quality = config.quality / 100;
      const mimeType = `image/${config.format}`;
      const base64 = cropCanvas.toDataURL(mimeType, quality);

      if (previewElement) {
        previewElement.style.backgroundImage = `url(${base64})`;
      }

      cropCanvas.toBlob((blob) => {
        if (blob) {
          onCrop({
            base64, blob,
            width: outputSize,
            height: outputHeight,
            imagePosition: { x1: 0, y1: 0, x2: outputSize, y2: outputHeight },
            cropperPosition: { x1: 0, y1: 0, x2: outputSize, y2: outputHeight },
          } as ImageCroppedEvent);
        }
      }, mimeType, quality);
    };

    // Actualización simple con throttle
    let lastUpdateTime = 0;
    const throttleMs = 16;

    const update = (forceCrop = false): void => {
      constrainPosition();
      updateTransform();

      const now = Date.now();
      if (forceCrop || now - lastUpdateTime > throttleMs) {
        lastUpdateTime = now;
        performCrop();
      }
    };

    const updateZoomUI = (): void => {
      const displayPercent = Math.round((state.scale / state.minScale) * 100);
      if (zoomSlider) zoomSlider.value = String(displayPercent);
    };

    const setZoom = (newScale: number, updateSlider = true): void => {
      const oldScale = state.scale;
      state.scale = Math.max(state.minScale, Math.min(state.maxScale, newScale));
      if (oldScale === state.scale) return;

      const factor = state.scale / oldScale;
      state.translateX *= factor;
      state.translateY *= factor;
      if (updateSlider) updateZoomUI();
      update();
    };

    // Event handlers
    const handleMouseDown = (e: MouseEvent): void => {
      if (e.button !== 0) return;
      e.preventDefault();
      state.isDragging = true;
      state.startX = e.clientX;
      state.startY = e.clientY;
      state.startTranslateX = state.translateX;
      state.startTranslateY = state.translateY;
      imageContainer.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: MouseEvent): void => {
      if (!state.isDragging) return;
      e.preventDefault();
      state.translateX = state.startTranslateX + (e.clientX - state.startX);
      state.translateY = state.startTranslateY + (e.clientY - state.startY);
      update();
    };

    const handleMouseUp = (): void => {
      if (state.isDragging) {
        state.isDragging = false;
        imageContainer.style.cursor = 'grab';
        update(true); // Forzar crop final
      }
    };

    const getTouchDistance = (t: TouchList): number => {
      if (t.length < 2) return 0;
      const dx = t[0].clientX - t[1].clientX;
      const dy = t[0].clientY - t[1].clientY;
      return Math.hypot(dx, dy);
    };

    const handleTouchStart = (e: TouchEvent): void => {
      e.preventDefault();
      if (e.touches.length === 1) {
        state.isDragging = true;
        state.startX = e.touches[0].clientX;
        state.startY = e.touches[0].clientY;
        state.startTranslateX = state.translateX;
        state.startTranslateY = state.translateY;
      } else if (e.touches.length === 2) {
        state.isDragging = false;
        state.lastPinchDistance = getTouchDistance(e.touches);
        state.lastPinchScale = state.scale;
      }
    };

    const handleTouchMove = (e: TouchEvent): void => {
      e.preventDefault();
      if (e.touches.length === 1 && state.isDragging) {
        state.translateX = state.startTranslateX + (e.touches[0].clientX - state.startX);
        state.translateY = state.startTranslateY + (e.touches[0].clientY - state.startY);
        update();
      } else if (e.touches.length === 2 && state.lastPinchDistance > 0) {
        const dist = getTouchDistance(e.touches);
        setZoom(state.lastPinchScale * (dist / state.lastPinchDistance));
      }
    };

    const handleTouchEnd = (e: TouchEvent): void => {
      if (e.touches.length === 0) {
        if (state.isDragging || state.lastPinchDistance > 0) {
          update(true); // Forzar crop final
        }
        state.isDragging = false;
        state.lastPinchDistance = 0;
      } else if (e.touches.length === 1) {
        if (state.lastPinchDistance > 0) {
          update(true); // Forzar crop después de pinch
        }
        state.isDragging = true;
        state.startX = e.touches[0].clientX;
        state.startY = e.touches[0].clientY;
        state.startTranslateX = state.translateX;
        state.startTranslateY = state.translateY;
        state.lastPinchDistance = 0;
      }
    };

    const handleWheel = (e: WheelEvent): void => {
      e.preventDefault();
      setZoom(state.scale * (e.deltaY > 0 ? 0.92 : 1.08));
    };

    const handleZoomSlider = (): void => {
      const percent = parseInt(zoomSlider.value);
      setZoom((percent / 100) * state.minScale, false);
    };

    const handleZoomIn = (): void => setZoom(state.scale * 1.15);
    const handleZoomOut = (): void => setZoom(state.scale * 0.85);

    const calculateCropSize = (): void => {
      const maxSize = Math.min(state.containerWidth, state.containerHeight) * 0.85;
      if (aspectRatio >= 1) {
        state.cropWidth = maxSize;
        state.cropHeight = maxSize / aspectRatio;
      } else {
        state.cropHeight = maxSize;
        state.cropWidth = maxSize * aspectRatio;
      }
      cropArea.style.width = `${state.cropWidth}px`;
      cropArea.style.height = `${state.cropHeight}px`;
    };

    const calculateMinScale = (): void => {
      state.minScale = Math.max(
        state.cropWidth / state.imageWidth,
        state.cropHeight / state.imageHeight
      );
      if (state.scale < state.minScale) state.scale = state.minScale;
    };

    const handleResize = (): void => {
      const newW = container.offsetWidth;
      const newH = container.offsetHeight;
      if (newW === state.containerWidth && newH === state.containerHeight) return;

      state.containerWidth = newW;
      state.containerHeight = newH;
      calculateCropSize();
      calculateMinScale();

      const maxPercent = Math.round((state.maxScale / state.minScale) * 100);
      if (zoomSlider) {
        zoomSlider.min = '100';
        zoomSlider.max = String(maxPercent);
      }
      updateZoomUI();
      update(true);
    };

    // Cargar imagen
    img.onload = (): void => {
      onLoad();

      state.imageWidth = img.naturalWidth;
      state.imageHeight = img.naturalHeight;
      state.containerWidth = container.offsetWidth;
      state.containerHeight = container.offsetHeight;

      calculateCropSize();
      calculateMinScale();
      state.scale = state.minScale;

      const maxPercent = Math.round((state.maxScale / state.minScale) * 100);
      if (zoomSlider) {
        zoomSlider.min = '100';
        zoomSlider.max = String(maxPercent);
        zoomSlider.value = '100';
      }

      updateTransform();
      performCrop();

      // Registrar eventos
      imageContainer.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      imageContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
      imageContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
      imageContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
      imageContainer.addEventListener('touchcancel', handleTouchEnd, { passive: false });

      imageContainer.addEventListener('wheel', handleWheel, { passive: false });

      if (zoomSlider) zoomSlider.addEventListener('input', handleZoomSlider);
      if (zoomInBtn) zoomInBtn.addEventListener('click', handleZoomIn);
      if (zoomOutBtn) zoomOutBtn.addEventListener('click', handleZoomOut);

      window.addEventListener('resize', handleResize);

      // Funciones de limpieza
      this.cleanupFunctions.push(() => {
        imageContainer.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        imageContainer.removeEventListener('touchstart', handleTouchStart);
        imageContainer.removeEventListener('touchmove', handleTouchMove);
        imageContainer.removeEventListener('touchend', handleTouchEnd);
        imageContainer.removeEventListener('touchcancel', handleTouchEnd);
        imageContainer.removeEventListener('wheel', handleWheel);
        if (zoomSlider) zoomSlider.removeEventListener('input', handleZoomSlider);
        if (zoomInBtn) zoomInBtn.removeEventListener('click', handleZoomIn);
        if (zoomOutBtn) zoomOutBtn.removeEventListener('click', handleZoomOut);
        window.removeEventListener('resize', handleResize);
      });
    };

    img.onerror = (): void => {
      const errorColor = isDark ? '#f87171' : '#dc2626';
      container.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100%;color:${errorColor};flex-direction:column;gap:8px;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <p style="margin:0;">Error al cargar la imagen</p>
        </div>`;
    };

    img.src = imageBase64;
  }

  /**
   * Convierte un archivo a base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Convierte base64 a Blob
   */
  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64.split(',')[1] || base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }
}
