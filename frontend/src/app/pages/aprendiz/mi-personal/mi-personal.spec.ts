import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiPersonal } from './mi-personal';

describe('MiPersonal', () => {
  let component: MiPersonal;
  let fixture: ComponentFixture<MiPersonal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiPersonal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MiPersonal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
