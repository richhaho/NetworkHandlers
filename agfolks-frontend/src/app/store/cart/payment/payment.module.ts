import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Routing component mange routing and import custom component.
import { PaymentRoutingModule } from './payment-routing.module';
// Import shared module
import { SharedModule } from '../../../shared/shared.module';
import { PaymentBannerComponent } from './payment-banner/payment-banner.component';

@NgModule({
  declarations: [
    PaymentRoutingModule.component,
    PaymentBannerComponent],
  imports: [
    CommonModule,
    PaymentRoutingModule,
    SharedModule
  ]
})
export class PaymentModule { }
