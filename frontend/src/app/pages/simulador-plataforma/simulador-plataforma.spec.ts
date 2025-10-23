import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimuladorPlataforma } from './simulador-plataforma';

describe('SimuladorPlataforma', () => {
  let component: SimuladorPlataforma;
  let fixture: ComponentFixture<SimuladorPlataforma>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimuladorPlataforma]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SimuladorPlataforma);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
