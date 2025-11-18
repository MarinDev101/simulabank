import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SimulacionService, ConfiguracionSimulacion } from '@app/services/simulacion/simulacion';

@Component({
  selector: 'app-configuracion-simulacion',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './configuracion-simulacion.html',
})
export class ConfiguracionSimulacionComponent {
  @Output() onIniciarSimulacion = new EventEmitter<any>();

  datosFormulario = {
    producto: '',
    modo: '',
    destino: 'personal',
    interaccion: '',
  };

  cargando = false;
  error: string | null = null;

  private productosCaptacion = ['cuenta_ahorros', 'cuenta_corriente', 'cdt_digital'];
  private productosColocacion = [
    'credito_libre_inversion',
    'credito_educativo_educaplus',
    'credito_rotativo_empresarial',
  ];

  constructor(private simulacionService: SimulacionService) {}

  private seleccionarProductoAleatorio(categoria: string): string {
    let productos: string[] = [];

    switch (categoria) {
      case 'todos-productos':
        productos = [...this.productosCaptacion, ...this.productosColocacion];
        break;
      case 'productos-captacion':
        productos = this.productosCaptacion;
        break;
      case 'productos-colocacion':
        productos = this.productosColocacion;
        break;
      default:
        return categoria;
    }

    const indiceAleatorio = Math.floor(Math.random() * productos.length);
    return productos[indiceAleatorio];
  }

  enviarFormulario(form: NgForm) {
    if (form.valid) {
      this.error = null;
      this.cargando = true;

      // Crear configuración
      const configuracion: ConfiguracionSimulacion = {
        producto: this.seleccionarProductoAleatorio(this.datosFormulario.producto) as any,
        modo: this.datosFormulario.modo as 'aprendizaje' | 'evaluativo',
        destino: this.datosFormulario.destino as 'personal' | 'sala',
        interaccion: this.datosFormulario.interaccion as 'automatico' | 'manual',
      };

      console.log('🚀 Iniciando simulación con:', configuracion);

      this.simulacionService.iniciarSimulacion(configuracion).subscribe({
        next: (response) => {
          console.log('✅ Simulación iniciada exitosamente:', response);
          this.cargando = false;
          this.onIniciarSimulacion.emit(response);
        },
        error: (error) => {
          console.error('❌ Error al iniciar simulación:', error);
          this.cargando = false;
          this.error = error.error?.mensaje || 'Error al iniciar la simulación';
        },
      });
    }
  }
}
