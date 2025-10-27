import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InicioInstructor } from './inicio-instructor';

describe('InicioInstructor', () => {
  let component: InicioInstructor;
  let fixture: ComponentFixture<InicioInstructor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InicioInstructor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InicioInstructor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
