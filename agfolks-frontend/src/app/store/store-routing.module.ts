import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Import component 
import { StoreComponent } from './store.component'
import { CategoryCountComponent } from './category-count/category-count.component';
import { ProductFilterComponent } from './product-filter/product-filter.component';

const routes: Routes = [{
    path: '', component: StoreComponent
  },{
    path: ':category', component: StoreComponent
  }];

  @NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
  })
export class StoreRoutingModule {
    static component = [StoreComponent, CategoryCountComponent, ProductFilterComponent];
 }

