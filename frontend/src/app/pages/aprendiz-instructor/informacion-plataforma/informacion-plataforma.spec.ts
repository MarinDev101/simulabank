import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformacionPlataforma } from './informacion-plataforma';

describe('InformacionPlataforma', () => {
  let component: InformacionPlataforma;
  let fixture: ComponentFixture<InformacionPlataforma>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformacionPlataforma]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InformacionPlataforma);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
