import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlataformaLayout } from './plataforma-layout';

describe('PlataformaLayout', () => {
  let component: PlataformaLayout;
  let fixture: ComponentFixture<PlataformaLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlataformaLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlataformaLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
