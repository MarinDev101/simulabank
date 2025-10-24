import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-plataforma-layout',
  standalone: true,
  imports: [Sidebar, RouterOutlet],
  templateUrl: './plataforma-layout.html',
})
export class PlataformaLayout {}
