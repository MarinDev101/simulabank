import { Component } from '@angular/core';
import { HeaderPlataforma } from '../headers/header-plataforma/header-plataforma';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [HeaderPlataforma],
  templateUrl: './sidebar.html',
})
export class Sidebar {}
