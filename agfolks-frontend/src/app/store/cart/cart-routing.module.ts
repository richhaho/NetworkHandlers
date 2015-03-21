import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Import component 
import { CartComponent } from '../cart/cart.component';
import { CartBannerComponent } from './cart-banner/cart-banner.component';

const routes: Routes = [{
  path: '', component: CartComponent
  }];

  @NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
  })
export class CartRoutingModule {
    static component = [CartComponent, CartBannerComponent];
 }
