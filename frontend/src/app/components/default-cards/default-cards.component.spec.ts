import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DefaultCardsComponent } from './default-cards.component';

describe('DefaultCardsComponent', () => {
  let component: DefaultCardsComponent;
  let fixture: ComponentFixture<DefaultCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefaultCardsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DefaultCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
