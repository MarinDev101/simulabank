import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderBasico } from './header-basico';

describe('HeaderBasico', () => {
  let component: HeaderBasico;
  let fixture: ComponentFixture<HeaderBasico>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderBasico]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderBasico);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
