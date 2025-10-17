import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotFoundError } from './not-found-error';

describe('NotFoundError', () => {
  let component: NotFoundError;
  let fixture: ComponentFixture<NotFoundError>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundError]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotFoundError);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
