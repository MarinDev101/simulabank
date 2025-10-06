import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfiguracionSimulacion } from './pages/configuracion-simulacion/configuracion-simulacion';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ConfiguracionSimulacion],
  templateUrl: './app.html',
})
export class App {
  protected title = 'frontend';
}
