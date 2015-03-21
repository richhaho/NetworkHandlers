import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ng5SliderModule } from 'ng5-slider';

// Routing component mange routing and import custom component.
import { StoreRoutingModule } from './store-routing.module';

// Import shared module
import { SharedModule } from '../shared/shared.module';
import { PaginationModule } from 'ngx-bootstrap';

@NgModule({
  declarations: [
    StoreRoutingModule.component],
  imports: [
    CommonModule,
    StoreRoutingModule,
    SharedModule,
    PaginationModule.forRoot(),
    Ng5SliderModule
  ]
})
export class StoreModule { }
