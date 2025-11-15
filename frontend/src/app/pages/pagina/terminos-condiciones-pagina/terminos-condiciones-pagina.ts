import { Component } from '@angular/core';
import { HeaderBasico } from "@app/core/layout/headers/header-basico/header-basico";
import { Footer } from "@app/core/layout/footer/footer";

@Component({
  selector: 'app-terminos-condiciones-pagina',
  standalone: true,
  imports: [HeaderBasico, Footer],
  templateUrl: './terminos-condiciones-pagina.html',
})
export class TerminosCondicionesPagina {}
