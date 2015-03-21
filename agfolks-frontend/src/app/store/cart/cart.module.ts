import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Routing component mange routing and import custom component.
import { CartRoutingModule } from './cart-routing.module';

// Import shared module
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    CartRoutingModule.component,
    ],
  imports: [
    CommonModule,
    CartRoutingModule,
    SharedModule
  ]
})
export class CartModule { }
