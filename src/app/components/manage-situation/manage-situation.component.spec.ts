import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageSituationComponent } from './manage-situation.component';

describe('ManageSituationComponent', () => {
  let component: ManageSituationComponent;
  let fixture: ComponentFixture<ManageSituationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageSituationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageSituationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
