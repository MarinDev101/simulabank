import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NuevaContrasena } from './nueva-contrasena';

describe('NuevaContrasena', () => {
  let component: NuevaContrasena;
  let fixture: ComponentFixture<NuevaContrasena>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuevaContrasena]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NuevaContrasena);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
