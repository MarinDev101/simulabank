import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderBasico } from '@app/core/layout/headers/header-basico/header-basico';
import { Footer } from '@app/core/layout/footer/footer';
import { NuevaContrasena } from '../recuperar-contrasena-fases/nueva-contrasena/nueva-contrasena';
import { Validacion } from '../recuperar-contrasena-fases/validacion/validacion';
import { Solicitud } from '../recuperar-contrasena-fases/solicitud/solicitud';


@Component({
  selector: 'app-recuperar-contrasena',
  standalone: true,
  imports: [CommonModule, HeaderBasico, Footer, NuevaContrasena, Validacion, Solicitud],
  templateUrl: './recuperar-contrasena.html',
})
export class RecuperarContrasena {
  pasoActual = 1;
  correoUsuario = '';
  datosRegistro: any = null; // Almacenar datos completos del registro

  siguientePaso(datos?: any) {

    if (datos?.correo) {
      this.correoUsuario = datos.correo;
      this.datosRegistro = datos;
    }

    if (this.pasoActual < 3) {
      this.pasoActual++;
    }
  }

  anteriorPaso() {
    if (this.pasoActual > 1) {
      this.pasoActual--;
    }
  }

  irAlPaso(paso: number) {
    this.pasoActual = paso;
  }
}
