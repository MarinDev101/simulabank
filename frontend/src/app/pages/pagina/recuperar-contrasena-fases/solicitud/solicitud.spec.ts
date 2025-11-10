import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Solicitud } from './solicitud';

describe('Solicitud', () => {
  let component: Solicitud;
  let fixture: ComponentFixture<Solicitud>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Solicitud]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Solicitud);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
