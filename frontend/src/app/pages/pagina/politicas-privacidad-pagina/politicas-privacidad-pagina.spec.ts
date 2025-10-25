import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoliticasPrivacidadPagina } from './politicas-privacidad-pagina';

describe('PoliticasPrivacidadPagina', () => {
  let component: PoliticasPrivacidadPagina;
  let fixture: ComponentFixture<PoliticasPrivacidadPagina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PoliticasPrivacidadPagina]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PoliticasPrivacidadPagina);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
