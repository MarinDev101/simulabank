import { Component } from '@angular/core';
import { Sidebar } from '@app/core/layout/sidebar/sidebar';

@Component({
  selector: 'app-inicio-aprendiz',
  standalone: true,
  imports: [Sidebar],
  templateUrl: './inicio-aprendiz.html',
})
export class InicioAprendiz {}
