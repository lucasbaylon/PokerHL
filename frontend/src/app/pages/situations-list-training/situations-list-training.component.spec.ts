import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SituationsListTrainingComponent } from './situations-list-training.component';

describe('SituationsListTrainingComponent', () => {
  let component: SituationsListTrainingComponent;
  let fixture: ComponentFixture<SituationsListTrainingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SituationsListTrainingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SituationsListTrainingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
