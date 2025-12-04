import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EvidenciasService, Evidencia } from '@app/services/evidencias/evidencias';
import { PdfJsViewerModule } from 'ng2-pdfjs-viewer';
import { AlertService } from '@app/services/alert/alert.service';

@Component({
  selector: 'app-mi-personal',
  standalone: true,
  imports: [CommonModule, FormsModule, PdfJsViewerModule],
  templateUrl: './mi-personal.html',
})
export class MiPersonal implements OnInit {
  private evidenciasService = inject(EvidenciasService);
  private alertService = inject(AlertService);

  // Datos
  evidencias: Evidencia[] = [];
  evidenciasFiltradas: Evidencia[] = [];
  evidenciasPaginadas: Evidencia[] = [];

  // Estado
  cargando = false;
  error: string | null = null;

  // Filtros
  filtroEstado: 'todas' | 'visibles' | 'archivadas' = 'visibles';
  filtroFechaDesde: string = '';
  filtroFechaHasta: string = '';

  // Paginación
  paginaActual = 1;
  itemsPorPagina = 5;
  totalPaginas = 0;
  selectedValue = 5;
  isOpen = false;

  // Modal PDF
  mostrarModalPdf = false;
  pdfSrc: string | Blob | Uint8Array | null = null;
  nombreArchivoPdf = '';
  cargandoPdf = false;
  evidenciaEnModalId: number | null = null;
  evidenciaEnModalEstado: 'visible' | 'archivada' | null = null;

  ngOnInit(): void {
    this.cargarEvidencias();
  }

  /**
   * Carga las evidencias desde el servidor
   */
  cargarEvidencias(): void {
    this.cargando = true;
    this.error = null;

    this.evidenciasService.listarEvidencias().subscribe({
      next: (evidencias) => {
        this.evidencias = evidencias;
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar las evidencias. Por favor, intenta de nuevo.';
        this.cargando = false;
        console.error(err);
        this.alertService.error('Error', 'No se pudieron cargar las evidencias. Por favor, intenta de nuevo.');
      },
    });
  }

  /**
   * Aplica los filtros a las evidencias
   */
  aplicarFiltros(): void {
    let resultado = [...this.evidencias];

    // Filtro por estado
    if (this.filtroEstado === 'visibles') {
      resultado = resultado.filter((e) => e.estado === 'visible');
    } else if (this.filtroEstado === 'archivadas') {
      resultado = resultado.filter((e) => e.estado === 'archivada');
    }

    // Filtro por fecha desde
    if (this.filtroFechaDesde) {
      const fechaDesde = new Date(this.filtroFechaDesde);
      resultado = resultado.filter((e) => new Date(e.fecha_agregado) >= fechaDesde);
    }

    // Filtro por fecha hasta
    if (this.filtroFechaHasta) {
      const fechaHasta = new Date(this.filtroFechaHasta);
      fechaHasta.setHours(23, 59, 59, 999); // Final del día
      resultado = resultado.filter((e) => new Date(e.fecha_agregado) <= fechaHasta);
    }

    this.evidenciasFiltradas = resultado;
    this.paginaActual = 1;
    this.calcularPaginacion();
  }

  /**
   * Calcula la paginación
   */
  calcularPaginacion(): void {
    this.totalPaginas = Math.ceil(this.evidenciasFiltradas.length / this.itemsPorPagina);
    this.actualizarPaginaActual();
  }

  /**
   * Actualiza la página actual
   */
  actualizarPaginaActual(): void {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.evidenciasPaginadas = this.evidenciasFiltradas.slice(inicio, fin);
  }

  /**
   * Cambia el filtro de estado
   */
  cambiarFiltroEstado(estado: 'todas' | 'visibles' | 'archivadas'): void {
    this.filtroEstado = estado;
    this.aplicarFiltros();
  }

  /**
   * Maneja el cambio de fecha desde
   */
  onFechaDesdeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filtroFechaDesde = input.value;
    this.aplicarFiltros();
  }

  /**
   * Maneja el cambio de fecha hasta
   */
  onFechaHastaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filtroFechaHasta = input.value;
    this.aplicarFiltros();
  }

  /**
   * Navega a la página anterior
   */
  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.actualizarPaginaActual();
    }
  }

  /**
   * Navega a la página siguiente
   */
  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
      this.actualizarPaginaActual();
    }
  }

  /**
   * Dropdown de items por página
   */
  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  selectValue(value: number, event: Event): void {
    event.preventDefault();
    this.selectedValue = value;
    this.itemsPorPagina = value;
    this.isOpen = false;
    this.calcularPaginacion();

    const active = document.activeElement as HTMLElement | null;
    if (active) {
      active.blur();
    }
  }

  /**
   * Visualiza una evidencia
   */
  visualizarEvidencia(evidencia: Evidencia): void {
    this.cargandoPdf = true;
    this.mostrarModalPdf = true;
    this.nombreArchivoPdf = evidencia.nombreSugerido;
    this.evidenciaEnModalId = evidencia.id_simulacion;
    this.evidenciaEnModalEstado = evidencia.estado as 'visible' | 'archivada';

    this.evidenciasService.verEvidencia(evidencia.id_simulacion).subscribe({
      next: (response) => {
        // Convertir base64 a Blob y pasar el Blob directamente al componente.
        // El componente creará un objectURL internamente y gestionará su revocación.
        const byteCharacters = atob(response.pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        this.pdfSrc = blob;
        this.cargandoPdf = false;
      },
      error: (err) => {
        console.error('Error al visualizar PDF:', err);
        this.alertService.error('Error', 'Error al cargar el PDF. Por favor, intenta de nuevo.');
        this.cerrarModalPdf();
      },
    });
  }

  /**
   * Cierra el modal de PDF
   */
  cerrarModalPdf(): void {
    // Si `pdfSrc` es un string que contiene un blob URL, revocarlo.
    if (this.pdfSrc) {
      try {
        if (typeof this.pdfSrc === 'string' && this.pdfSrc.startsWith('blob:')) {
          URL.revokeObjectURL(this.pdfSrc);
        }
      } catch (_) {
        // noop
      }
      this.pdfSrc = null;
    }
    this.mostrarModalPdf = false;
    this.cargandoPdf = false;
    this.evidenciaEnModalId = null;
    this.evidenciaEnModalEstado = null;
  }

  /**
   * Descarga el PDF mostrado en el modal.
   * Usa el Blob si está disponible; si no, delega al servicio usando el id.
   */
  descargarPdfModal(): void {
    if (!this.pdfSrc) {
      if (this.evidenciaEnModalId) {
        this.evidenciasService
          .descargarEvidencia(this.evidenciaEnModalId, this.nombreArchivoPdf)
          .subscribe({
            next: () => {
              console.log('Descarga iniciada (servicio)');
            },
            error: (err) => {
              console.error('Error al descargar (servicio):', err);
              this.alertService.error('Error', 'Error al descargar el archivo. Por favor, intenta de nuevo.');
            },
          });
      }
      return;
    }

    try {
      if (this.pdfSrc instanceof Blob) {
        const blobUrl = URL.createObjectURL(this.pdfSrc);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = this.nombreArchivoPdf || 'archivo.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        return;
      }

      if (typeof this.pdfSrc === 'string') {
        const url = this.pdfSrc;
        fetch(url)
          .then((res) => res.blob())
          .then((b) => {
            const blobUrl = URL.createObjectURL(b);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = this.nombreArchivoPdf || 'archivo.pdf';
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
          })
          .catch((err) => {
            console.error('Error descargando desde URL:', err);
            this.alertService.error('Error', 'No se pudo iniciar la descarga. Intenta descargar desde la lista.');
          });
        return;
      }
    } catch (err) {
      console.error('Error al iniciar descarga del PDF:', err);
      this.alertService.error('Error', 'Error al descargar el archivo. Por favor, intenta de nuevo.');
    }
  }

  /**
   * Descarga una evidencia
   */
  descargarEvidencia(evidencia: Evidencia): void {
    this.evidenciasService
      .descargarEvidencia(evidencia.id_simulacion, evidencia.nombreSugerido)
      .subscribe({
        next: () => {
          console.log('Descarga iniciada');
        },
        error: (err) => {
          console.error('Error al descargar:', err);
          this.alertService.error('Error', 'Error al descargar el archivo. Por favor, intenta de nuevo.');
        },
      });
  }

  /**
   * Archiva o desarchiva una evidencia
   */
  async toggleArchivar(evidencia: Evidencia): Promise<void> {
    const accion = evidencia.estado === 'visible' ? 'archivar' : 'desarchivar';
    const titulo = accion === 'archivar' ? '¿Archivar evidencia?' : '¿Desarchivar evidencia?';
    const mensaje =
      accion === 'archivar'
        ? '¿Estás seguro de archivar esta evidencia?'
        : '¿Estás seguro de desarchivar esta evidencia?';

    const confirmado = await this.alertService.confirm(
      titulo,
      mensaje,
      `Sí, ${accion}`,
      'Cancelar',
      'question'
    );

    if (!confirmado) return;

    const observable =
      accion === 'archivar'
        ? this.evidenciasService.archivarEvidencia(evidencia.id_simulacion)
        : this.evidenciasService.desarchivarEvidencia(evidencia.id_simulacion);

    observable.subscribe({
      next: () => {
        evidencia.estado = accion === 'archivar' ? 'archivada' : 'visible';
        this.aplicarFiltros();
        this.alertService.toastSuccess(`Evidencia ${accion === 'archivar' ? 'archivada' : 'desarchivada'} correctamente`);
      },
      error: (err) => {
        console.error(`Error al ${accion}:`, err);
        this.alertService.error('Error', `Error al ${accion} la evidencia. Por favor, intenta de nuevo.`);
      },
    });
  }

  /**
   * Elimina una evidencia
   */
  async eliminarEvidencia(evidencia: Evidencia): Promise<void> {
    const confirmado = await this.alertService.confirmDelete(
      'esta evidencia',
      '¿Estás seguro de eliminar esta evidencia? Esta acción no se puede deshacer.'
    );

    if (!confirmado) return;

    this.evidenciasService.eliminarEvidencia(evidencia.id_simulacion).subscribe({
      next: () => {
        this.evidencias = this.evidencias.filter(
          (e) => e.id_simulacion !== evidencia.id_simulacion
        );
        this.aplicarFiltros();
        this.alertService.toastSuccess('Evidencia eliminada correctamente');
      },
      error: (err) => {
        console.error('Error al eliminar:', err);
        this.alertService.error('Error', 'Error al eliminar la evidencia. Por favor, intenta de nuevo.');
      },
    });
  }

  /**
   * Formatea la fecha en formato dd/mm/yyyy hh:mm AM/PM
   */
  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    const anio = date.getFullYear();
    let horas = date.getHours();
    const minutos = date.getMinutes().toString().padStart(2, '0');
    const ampm = horas >= 12 ? 'PM' : 'AM';
    horas = horas % 12;
    horas = horas ? horas : 12; // La hora 0 debe ser 12
    const horasStr = horas.toString().padStart(2, '0');
    return `${dia}/${mes}/${anio} ${horasStr}:${minutos} ${ampm}`;
  }

  /**
   * Formatea la duración
   */
  formatearDuracion(segundos: number): string {
    return this.evidenciasService.formatearDuracion(segundos);
  }

  /**
   * Formatea el peso
   */
  formatearPeso(pesoKb: number | null): string {
    return this.evidenciasService.formatearPeso(pesoKb);
  }

  /**
   * Obtiene el color del badge según el modo
   */
  getColorModo(modo: string): string {
    return modo === 'aprendizaje'
      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
      : 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400';
  }
}
