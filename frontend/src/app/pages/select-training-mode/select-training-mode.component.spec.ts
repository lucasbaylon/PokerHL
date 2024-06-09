import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectTrainingModeComponent } from './select-training-mode.component';

describe('SelectTrainingModeComponent', () => {
  let component: SelectTrainingModeComponent;
  let fixture: ComponentFixture<SelectTrainingModeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectTrainingModeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SelectTrainingModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
