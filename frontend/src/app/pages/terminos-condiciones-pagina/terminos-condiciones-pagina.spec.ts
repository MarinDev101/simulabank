import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TerminosCondicionesPagina } from './terminos-condiciones-pagina';

describe('TerminosCondicionesPagina', () => {
  let component: TerminosCondicionesPagina;
  let fixture: ComponentFixture<TerminosCondicionesPagina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TerminosCondicionesPagina]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TerminosCondicionesPagina);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
