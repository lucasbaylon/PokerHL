import { TestBed } from '@angular/core/testing';

import { CheckSituationGuard } from './check-situation.guard';

describe('CheckSituationGuard', () => {
  let guard: CheckSituationGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(CheckSituationGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
