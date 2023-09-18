import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SituationsListTrainingComponent } from './situations-list-training.component';

describe('SituationsListTrainingComponent', () => {
  let component: SituationsListTrainingComponent;
  let fixture: ComponentFixture<SituationsListTrainingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SituationsListTrainingComponent]
    });
    fixture = TestBed.createComponent(SituationsListTrainingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
