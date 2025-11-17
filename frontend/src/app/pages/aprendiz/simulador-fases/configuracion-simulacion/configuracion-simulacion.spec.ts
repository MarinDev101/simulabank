import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfiguracionSimulacion } from './configuracion-simulacion';

describe('ConfiguracionSimulacion', () => {
  let component: ConfiguracionSimulacion;
  let fixture: ComponentFixture<ConfiguracionSimulacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfiguracionSimulacion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfiguracionSimulacion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
