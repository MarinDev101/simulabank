import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InformacionPlataforma } from './pages/informacion-plataforma/informacion-plataforma';
import { PoliticasPlataforma } from './pages/politicas-plataforma/politicas-plataforma';
import { ConfiguracionSimulacion } from './pages/configuracion-simulacion/configuracion-simulacion';
import { TerminosCondicionesPagina } from './pages/terminos-condiciones-pagina/terminos-condiciones-pagina';
import { PoliticasPrivacidadPagina } from "./pages/politicas-privacidad-pagina/politicas-privacidad-pagina";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ConfiguracionSimulacion, PoliticasPlataforma, InformacionPlataforma, TerminosCondicionesPagina, PoliticasPrivacidadPagina],
  templateUrl: './app.html',
})
export class App {
  protected title = 'frontend';
}
