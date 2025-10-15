import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfiguracionSimulacion } from './pages/configuracion-simulacion/configuracion-simulacion';
import { InformacionPlataforma } from "./pages/informacion-plataforma/informacion-plataforma";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ConfiguracionSimulacion, InformacionPlataforma],
  templateUrl: './app.html',
})
export class App {
  protected title = 'frontend';
}
