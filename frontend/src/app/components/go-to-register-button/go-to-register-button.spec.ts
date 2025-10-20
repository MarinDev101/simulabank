import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoToRegisterButton } from './go-to-register-button';

describe('GoToRegisterButton', () => {
  let component: GoToRegisterButton;
  let fixture: ComponentFixture<GoToRegisterButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoToRegisterButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoToRegisterButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
