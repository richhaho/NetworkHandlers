import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Slick slider
import { SlickCarouselModule } from 'ngx-slick-carousel';

// Image Zoom
import { NgxImageZoomModule } from 'ngx-image-zoom';

// Routing component mange routing and import custom component.
import { ProductRoutingModule } from './product-routing.module';

// Import shared module
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    ProductRoutingModule.component
  ],
  imports: [
    CommonModule,
    ProductRoutingModule,
    SharedModule,
    SlickCarouselModule,
    NgxImageZoomModule
  ]
})

export class ProductModule  {
  	myThumbnail="https://wittlock.github.io/ngx-image-zoom/assets/thumb.jpg";
  	myFullresImage="https://wittlock.github.io/ngx-image-zoom/assets/fullres.jpg";
}
