import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SituationManagerComponent } from './situation-manager.component';

describe('SituationManagerComponent', () => {
  let component: SituationManagerComponent;
  let fixture: ComponentFixture<SituationManagerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SituationManagerComponent]
    });
    fixture = TestBed.createComponent(SituationManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
