import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderPlataforma } from './header-plataforma';

describe('HeaderPlataforma', () => {
  let component: HeaderPlataforma;
  let fixture: ComponentFixture<HeaderPlataforma>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderPlataforma]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderPlataforma);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
