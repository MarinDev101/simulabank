import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalizarPerfil } from './personalizar-perfil';

describe('PersonalizarPerfil', () => {
  let component: PersonalizarPerfil;
  let fixture: ComponentFixture<PersonalizarPerfil>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalizarPerfil]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PersonalizarPerfil);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
