import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatosBasicos } from './datos-basicos';

describe('DatosBasicos', () => {
  let component: DatosBasicos;
  let fixture: ComponentFixture<DatosBasicos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatosBasicos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DatosBasicos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
