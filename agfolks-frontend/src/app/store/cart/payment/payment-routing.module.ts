import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Import component 
import { PaymentComponent } from '../payment/payment.component';
import { PaymentBannerComponent } from './payment-banner/payment-banner.component';

const routes: Routes = [{
  path: '', component: PaymentComponent
  }];

  @NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
  })
export class PaymentRoutingModule {
    static component = [PaymentComponent, PaymentBannerComponent];
 }

