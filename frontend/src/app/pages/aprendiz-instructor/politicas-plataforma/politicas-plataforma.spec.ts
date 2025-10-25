import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoliticasPlataforma } from './politicas-plataforma';

describe('PoliticasPlataforma', () => {
  let component: PoliticasPlataforma;
  let fixture: ComponentFixture<PoliticasPlataforma>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PoliticasPlataforma]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PoliticasPlataforma);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
