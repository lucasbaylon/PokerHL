import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SituationsListManagerComponent } from './situations-list-manager.component';

describe('SituationsListManagerComponent', () => {
  let component: SituationsListManagerComponent;
  let fixture: ComponentFixture<SituationsListManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SituationsListManagerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SituationsListManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
