import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Import component 
import { CheckoutComponent } from '../checkout/checkout.component';
import { CheckoutBannerComponent } from './checkout-banner/checkout-banner.component';

const routes: Routes = [{
  path: '', component: CheckoutComponent
  }];

  @NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
  })
export class CheckoutRoutingModule {
    static component = [CheckoutComponent, CheckoutBannerComponent];
 }

