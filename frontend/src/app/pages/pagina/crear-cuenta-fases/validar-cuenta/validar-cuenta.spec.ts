import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidarCuenta } from './validar-cuenta';

describe('ValidarCuenta', () => {
  let component: ValidarCuenta;
  let fixture: ComponentFixture<ValidarCuenta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValidarCuenta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValidarCuenta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
