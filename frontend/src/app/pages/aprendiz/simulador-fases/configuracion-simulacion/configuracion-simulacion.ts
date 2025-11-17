import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-configuracion-simulacion',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './configuracion-simulacion.html',
})
export class ConfiguracionSimulacion {
  datosFormulario = {
    producto: '',
    modo: '',
    destino: 'personal',
    interaccion: '',
  };

  // Definición de productos bancarios
  private productosCaptacion = ['cuenta_ahorros', 'cuenta_corriente', 'cdt_digital'];

  private productosColocacion = [
    'credito_libre_inversion',
    'credito_educativo_educaplus',
    'credito_rotativo_empresarial',
  ];

  /**
   * Selecciona un producto aleatorio según la categoría
   */
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
        return categoria; // Si es un producto específico, lo retorna tal cual
    }

    const indiceAleatorio = Math.floor(Math.random() * productos.length);
    return productos[indiceAleatorio];
  }

  enviarFormulario(form: NgForm) {
    if (form.valid) {
      // Crear una copia de los datos del formulario
      const datosEnvio = { ...this.datosFormulario };

      // Si el producto es una categoría aleatoria, seleccionar uno específico
      if (
        datosEnvio.producto === 'todos-productos' ||
        datosEnvio.producto === 'productos-captacion' ||
        datosEnvio.producto === 'productos-colocacion'
      ) {
        datosEnvio.producto = this.seleccionarProductoAleatorio(datosEnvio.producto);
      }

      console.log('Formulario enviado:', datosEnvio);
      console.log('Producto seleccionado:', datosEnvio.producto);

      // Aquí puedes agregar la lógica para enviar los datos a tu servicio
      // this.simulacionService.iniciarSimulacion(datosEnvio);
    } else {
      console.log('Formulario inválido');
    }
  }
}
