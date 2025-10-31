import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderBasico } from '@app/core/layout/headers/header-basico/header-basico';
import { Footer } from '@app/core/layout/footer/footer';
import { DatosBasicos } from '../crear-cuenta-fases/datos-basicos/datos-basicos';
import { ValidarCuenta } from '../crear-cuenta-fases/validar-cuenta/validar-cuenta';
import { PersonalizarPerfil } from '../crear-cuenta-fases/personalizar-perfil/personalizar-perfil';

@Component({
  selector: 'app-crear-cuenta',
  standalone: true,
  imports: [CommonModule, HeaderBasico, Footer, DatosBasicos, ValidarCuenta, PersonalizarPerfil],
  templateUrl: './crear-cuenta.html',
})
export class CrearCuenta {
  pasoActual = 1;

  siguientePaso() {
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
