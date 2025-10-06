import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Inicio } from './pages/inicio/inicio';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Inicio],
  templateUrl: './app.html',
})
export class App {
  protected title = 'frontend';
}
