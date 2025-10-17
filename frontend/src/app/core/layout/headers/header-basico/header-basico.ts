import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header-basico',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header-basico.html',
})
export class HeaderBasico {}
