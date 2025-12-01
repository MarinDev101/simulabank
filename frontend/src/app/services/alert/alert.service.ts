import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon, SweetAlertOptions, SweetAlertResult } from 'sweetalert2';

/**
 * Servicio centralizado para manejar alertas y notificaciones con SweetAlert2.
 * Detecta automáticamente el modo oscuro basándose en las clases de Tailwind/DaisyUI.
 */
@Injectable({
  providedIn: 'root',
})
export class AlertService {
  /**
   * Detecta si el modo oscuro está activo basándose en las clases de Tailwind/DaisyUI
   * Incluye verificación para SSR (Server Side Rendering)
   */
  private isDarkMode(): boolean {
    if (typeof document === 'undefined') return false;
    const html = document.documentElement;
    return (
      html.classList.contains('dark') ||
      html.getAttribute('data-theme') === 'dark'
    );
  }

  /**
   * Obtiene el tema actual para SweetAlert2
   */
  private getTheme(): 'dark' | 'light' {
    return this.isDarkMode() ? 'dark' : 'light';
  }

  /**
   * Configuración base para todas las alertas
   */
  private getBaseConfig() {
    return {
      theme: this.getTheme(),
      confirmButtonColor: '#00A448', // Verde principal de SimulaBank
      cancelButtonColor: '#6b7280', // Gris
      denyButtonColor: '#dc2626', // Rojo
    };
  }

  /**
   * Muestra una alerta de éxito
   */
  success(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      ...this.getBaseConfig(),
      icon: 'success',
      title,
      text,
      timer: 3000,
      timerProgressBar: true,
      showConfirmButton: true,
      confirmButtonText: 'Aceptar',
    });
  }

  /**
   * Muestra una alerta de error
   */
  error(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      ...this.getBaseConfig(),
      icon: 'error',
      title,
      text,
      confirmButtonText: 'Aceptar',
    });
  }

  /**
   * Muestra una alerta de advertencia
   */
  warning(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      ...this.getBaseConfig(),
      icon: 'warning',
      title,
      text,
      confirmButtonText: 'Aceptar',
    });
  }

  /**
   * Muestra una alerta informativa
   */
  info(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      ...this.getBaseConfig(),
      icon: 'info',
      title,
      text,
      confirmButtonText: 'Aceptar',
    });
  }

  /**
   * Muestra un diálogo de confirmación
   * @returns Promise que resuelve a true si se confirma, false si se cancela
   */
  confirm(
    title: string,
    text?: string,
    confirmButtonText: string = 'Sí, confirmar',
    cancelButtonText: string = 'Cancelar',
    icon: SweetAlertIcon = 'question'
  ): Promise<boolean> {
    return Swal.fire({
      ...this.getBaseConfig(),
      icon,
      title,
      text,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      reverseButtons: true,
    }).then((result) => result.isConfirmed);
  }

  /**
   * Muestra un diálogo de confirmación para eliminar
   */
  confirmDelete(
    itemName: string = 'este elemento',
    additionalText?: string
  ): Promise<boolean> {
    return Swal.fire({
      ...this.getBaseConfig(),
      icon: 'warning',
      title: '¿Estás seguro?',
      text: additionalText || `Esta acción eliminará ${itemName}. No se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626', // Rojo para eliminar
      reverseButtons: true,
    }).then((result) => result.isConfirmed);
  }

  /**
   * Muestra un toast (notificación pequeña)
   * @param colored - Si es true, usa colores de fondo personalizados según el tipo de icono
   */
  toast(
    title: string,
    icon: SweetAlertIcon = 'success',
    position: 'top' | 'top-end' | 'top-start' | 'center' | 'bottom' | 'bottom-end' | 'bottom-start' = 'top-end',
    timer: number = 3000,
    colored: boolean = true
  ): Promise<SweetAlertResult> {
    const coloredConfig = colored ? {
      iconColor: 'white',
      customClass: {
        popup: 'colored-toast',
      },
    } : {};

    return Swal.fire({
      theme: this.getTheme(),
      toast: true,
      position,
      icon,
      title,
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
      ...coloredConfig,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      },
    });
  }

  /**
   * Toast de éxito
   */
  toastSuccess(title: string): Promise<SweetAlertResult> {
    return this.toast(title, 'success');
  }

  /**
   * Toast de error
   */
  toastError(title: string): Promise<SweetAlertResult> {
    return this.toast(title, 'error');
  }

  /**
   * Toast de advertencia
   */
  toastWarning(title: string): Promise<SweetAlertResult> {
    return this.toast(title, 'warning');
  }

  /**
   * Toast informativo
   */
  toastInfo(title: string): Promise<SweetAlertResult> {
    return this.toast(title, 'info');
  }

  /**
   * Muestra un diálogo de carga
   */
  showLoading(title: string = 'Cargando...'): void {
    Swal.fire({
      theme: this.getTheme(),
      title,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  }

  /**
   * Cierra cualquier alerta abierta
   */
  close(): void {
    Swal.close();
  }

  /**
   * Muestra una alerta personalizada
   * @param options - Opciones de configuración de SweetAlert2
   */
  custom(options: SweetAlertOptions): Promise<SweetAlertResult> {
    return Swal.fire({
      ...this.getBaseConfig(),
      ...options,
    });
  }
}
