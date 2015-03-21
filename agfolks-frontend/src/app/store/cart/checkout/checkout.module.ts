import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Routing component mange routing and import custom component.
import { CheckoutRoutingModule } from './checkout-routing.module';

// Import shared module
import { SharedModule } from '../../../shared/shared.module';
import { CheckoutBannerComponent } from './checkout-banner/checkout-banner.component';

@NgModule({
  declarations: [
    CheckoutRoutingModule.component,
    CheckoutBannerComponent],
  imports: [
    CommonModule,
    CheckoutRoutingModule,
    SharedModule,
  ]
})
export class CheckoutModule { }
