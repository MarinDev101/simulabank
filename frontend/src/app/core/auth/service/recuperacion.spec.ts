import { TestBed } from '@angular/core/testing';

import { Recuperacion } from './recuperacion';

describe('Recuperacion', () => {
  let service: Recuperacion;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Recuperacion);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
