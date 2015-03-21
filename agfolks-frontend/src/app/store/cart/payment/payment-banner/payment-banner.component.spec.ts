import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentBannerComponent } from './payment-banner.component';

describe('PaymentBannerComponent', () => {
  let component: PaymentBannerComponent;
  let fixture: ComponentFixture<PaymentBannerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PaymentBannerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
