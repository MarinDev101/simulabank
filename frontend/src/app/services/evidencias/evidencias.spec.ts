import { TestBed } from '@angular/core/testing';

import { Evidencias } from './evidencias';

describe('Evidencias', () => {
  let service: Evidencias;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Evidencias);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
