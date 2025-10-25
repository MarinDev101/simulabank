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
    destino: '',
    interaccion: ''
  };

  enviarFormulario(form: NgForm) {
    if (form.valid) {
      console.log('Formulario enviado:', this.datosFormulario);
    } else {
      console.log('Formulario inválido');
    }
  }
}
