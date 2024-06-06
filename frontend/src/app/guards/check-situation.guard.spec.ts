import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { checkSituationGuard } from './check-situation.guard';

describe('checkSituationGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => checkSituationGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
