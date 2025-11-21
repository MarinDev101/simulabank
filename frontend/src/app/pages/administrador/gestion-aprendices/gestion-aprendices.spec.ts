import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionAprendices } from './gestion-aprendices';

describe('GestionAprendices', () => {
  let component: GestionAprendices;
  let fixture: ComponentFixture<GestionAprendices>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionAprendices]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionAprendices);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
