import { Component } from '@angular/core';
import { HeaderPlataforma } from '@app/components/header-plataforma/header-plataforma';

@Component({
  selector: 'app-informacion-plataforma',
  standalone: true,
  imports: [HeaderPlataforma],
  templateUrl: './informacion-plataforma.html',
})
export class InformacionPlataforma {}
