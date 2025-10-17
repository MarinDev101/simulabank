import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InicioAprendiz } from './inicio-aprendiz';

describe('InicioAprendiz', () => {
  let component: InicioAprendiz;
  let fixture: ComponentFixture<InicioAprendiz>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InicioAprendiz]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InicioAprendiz);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
