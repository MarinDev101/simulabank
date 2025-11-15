import { Component } from '@angular/core';
import { Footer } from "@app/core/layout/footer/footer";
import { HeaderBasico } from "@app/core/layout/headers/header-basico/header-basico";

@Component({
  selector: 'app-politicas-privacidad-pagina',
  standalone: true,
  imports: [Footer, HeaderBasico],
  templateUrl: './politicas-privacidad-pagina.html',
})
export class PoliticasPrivacidadPagina {}
