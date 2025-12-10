import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, Usuario } from '@app/core/auth/service/auth';
import { AdminService } from '@app/core/auth/service/admin';
import { AlertService } from '@app/services/alert/alert.service';
import { SoloLetrasDirective, EmailFormatDirective } from '@app/shared/directives';

@Component({
  selector: 'app-gestion-aprendices',
  standalone: true,
  imports: [CommonModule, FormsModule, SoloLetrasDirective, EmailFormatDirective],
  templateUrl: './gestion-aprendices.html',
})
export class GestionAprendices implements OnInit {
  private authService = inject(AuthService);
  private adminService = inject(AdminService);
  private alertService = inject(AlertService);

  // Datos
  aprendices: Usuario[] = [];
  aprendicesFiltrados: Usuario[] = [];
  aprendicesPaginados: Usuario[] = [];

  // Estado
  cargando = false;
  error: string | null = null;

  // Filtros
  filtroEstado: 'todos' | 'activos' | 'inactivos' = 'activos';
  filtroFechaDesde: string = '';
  filtroFechaHasta: string = '';
  filtroBusqueda: string = '';

  // Paginación
  paginaActual = 1;
  itemsPorPagina = 5;
  totalPaginas = 0;
  selectedValue = 5;
  isOpen = false;

  // Edición
  aprendizEditando: Usuario | null = null;

  ngOnInit(): void {
    this.cargarAprendices();
  }

  /**
   * Carga los aprendices desde el servidor
   */
  cargarAprendices(): void {
    this.cargando = true;
    this.error = null;

    this.adminService.obtenerTodosLosAprendices().subscribe({
      next: (aprendices) => {
        this.aprendices = aprendices;
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los aprendices. Por favor, intenta de nuevo.';
        this.cargando = false;
        this.alertService.error(
          'Error',
          'No se pudieron cargar los aprendices. Por favor, intenta de nuevo.'
        );
      },
    });
  }

  /**
   * Aplica los filtros a los aprendices
   */
  aplicarFiltros(): void {
    let resultado = [...this.aprendices];

    // Filtro por estado
    if (this.filtroEstado === 'activos') {
      resultado = resultado.filter((a) => a.estado === 'activo');
    } else if (this.filtroEstado === 'inactivos') {
      resultado = resultado.filter((a) => a.estado === 'inactivo');
    }

    // Filtro por búsqueda
    if (this.filtroBusqueda) {
      const busqueda = this.filtroBusqueda.toLowerCase();
      resultado = resultado.filter(
        (a) =>
          `${a.nombres} ${a.apellidos}`.toLowerCase().includes(busqueda) ||
          a.correo.toLowerCase().includes(busqueda)
      );
    }

    // Filtro por fecha desde
    if (this.filtroFechaDesde) {
      const fechaDesde = new Date(this.filtroFechaDesde);
      resultado = resultado.filter((a) => new Date(a.fecha_creacion) >= fechaDesde);
    }

    // Filtro por fecha hasta
    if (this.filtroFechaHasta) {
      const fechaHasta = new Date(this.filtroFechaHasta);
      fechaHasta.setHours(23, 59, 59, 999);
      resultado = resultado.filter((a) => new Date(a.fecha_creacion) <= fechaHasta);
    }

    this.aprendicesFiltrados = resultado;
    this.paginaActual = 1;
    this.calcularPaginacion();
  }

  /**
   * Calcula la paginación
   */
  calcularPaginacion(): void {
    this.totalPaginas = Math.ceil(this.aprendicesFiltrados.length / this.itemsPorPagina);
    this.actualizarPaginaActual();
  }

  /**
   * Actualiza la página actual
   */
  actualizarPaginaActual(): void {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.aprendicesPaginados = this.aprendicesFiltrados.slice(inicio, fin);
  }

  /**
   * Cambia el filtro de estado
   */
  cambiarFiltroEstado(estado: 'todos' | 'activos' | 'inactivos'): void {
    this.filtroEstado = estado;
    this.aplicarFiltros();
  }

  /**
   * Maneja el cambio de búsqueda
   */
  onBuscarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filtroBusqueda = input.value;
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
   * Inicia la edición de un aprendiz
   */
  editarAprendiz(aprendiz: Usuario): void {
    this.aprendizEditando = { ...aprendiz };
  }

  /**
   * Guarda los cambios del aprendiz
   */
  guardarAprendiz(): void {
    if (!this.aprendizEditando) return;

    this.adminService.actualizarAprendiz(this.aprendizEditando).subscribe({
      next: (response) => {
        // Actualizar en la lista local
        const index = this.aprendices.findIndex((a) => a.id === this.aprendizEditando!.id);
        if (index !== -1) {
          this.aprendices[index] = { ...this.aprendizEditando! };
        }

        this.aprendizEditando = null;

        // Recargar la lista completa de aprendices
        this.cargarAprendices();

        this.alertService.toastSuccess('Aprendiz actualizado correctamente');
      },
      error: (err) => {
        if (err.status === 403) {
          this.alertService.error('Sesión expirada', 'Por favor, inicia sesión nuevamente.');
          setTimeout(() => {
            this.authService.logout().subscribe(() => {
              window.location.href = '/iniciar-sesion';
            });
          }, 2000);
        } else {
          const mensajeError =
            err.error?.error || 'Error al actualizar el aprendiz. Por favor, intenta de nuevo.';
          this.alertService.error('Error', mensajeError);
        }
      },
    });
  }

  /**
   * Cancela la edición
   */
  cancelarEdicion(): void {
    this.aprendizEditando = null;
  }

  /**
   * Inhabilita un aprendiz
   */
  async inhabilitarAprendiz(aprendiz: Usuario): Promise<void> {
    const confirmado = await this.alertService.confirm(
      '¿Inhabilitar aprendiz?',
      `¿Estás seguro de inhabilitar a ${aprendiz.nombres} ${aprendiz.apellidos}?`,
      'Sí, inhabilitar',
      'Cancelar',
      'warning'
    );

    if (!confirmado) return;

    this.adminService.inhabilitarAprendiz(aprendiz.id).subscribe({
      next: () => {
        aprendiz.estado = 'inactivo';
        this.aplicarFiltros();
        this.alertService.toastSuccess('Aprendiz inhabilitado correctamente');
      },
      error: (err) => {
        this.alertService.error(
          'Error',
          'Error al inhabilitar el aprendiz. Por favor, intenta de nuevo.'
        );
      },
    });
  }

  /**
   * Habilita un aprendiz
   */
  async habilitarAprendiz(aprendiz: Usuario): Promise<void> {
    const confirmado = await this.alertService.confirm(
      '¿Habilitar aprendiz?',
      `¿Estás seguro de habilitar a ${aprendiz.nombres} ${aprendiz.apellidos}?`,
      'Sí, habilitar',
      'Cancelar',
      'question'
    );

    if (!confirmado) return;

    this.adminService.habilitarAprendiz(aprendiz.id).subscribe({
      next: () => {
        aprendiz.estado = 'activo';
        this.aplicarFiltros();
        this.alertService.toastSuccess('Aprendiz habilitado correctamente');
      },
      error: (err) => {
        this.alertService.error(
          'Error',
          'Error al habilitar el aprendiz. Por favor, intenta de nuevo.'
        );
      },
    });
  }

  /**
   * Formatea la fecha
   */
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Obtiene el color del badge según el estado
   */
  getColorEstado(estado: string): string {
    return estado === 'activo'
      ? 'bg-[#00A448]/10 text-[#00A448] dark:bg-[#00A448]/20'
      : 'bg-[#f59e0b]/10 text-[#f59e0b] dark:bg-[#f59e0b]/20';
  }

  /**
   * Obtiene el texto del estado
   */
  getTextoEstado(estado: string): string {
    return estado === 'activo' ? 'Activo' : 'Inactivo';
  }
}
