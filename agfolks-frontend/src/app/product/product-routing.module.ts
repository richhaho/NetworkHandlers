import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Import component 
import { ProductComponent } from './product.component'
import { ProductLikeComponent } from './product-like/product-like.component';
import { ReviewsComponent } from './reviews/reviews.component';

const routes: Routes = [{
  path: '', component: ProductComponent
  }];

  @NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
  })
export class ProductRoutingModule {
    static component = [ProductComponent, ProductLikeComponent, ReviewsComponent];
 }

