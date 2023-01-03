import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditSituationComponent } from './edit-situation.component';

describe('EditSituationComponent', () => {
  let component: EditSituationComponent;
  let fixture: ComponentFixture<EditSituationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditSituationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditSituationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
