import { Component } from '@angular/core';
import { GoToRegisterButton } from '@app/components/go-to-register-button/go-to-register-button';
import { Footer } from '@app/core/layout/footer/footer';
import { HeaderBasico } from '@app/core/layout/headers/header-basico/header-basico';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [HeaderBasico, Footer, GoToRegisterButton],
  templateUrl: './inicio.html',
})
export class Inicio {}
