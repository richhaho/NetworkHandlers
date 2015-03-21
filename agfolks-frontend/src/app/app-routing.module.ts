import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Import Custome component.
import { HomeComponent } from './home/home.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { SliderComponent } from './home/slider/slider.component';
import { MenuComponent } from './header/menu/menu.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { ManufacturerSignupComponent } from './sign-up/manufacturer-signup/manufacturer-signup.component';
import { ThankYouComponent } from './thank-you/thank-you.component';
import { LoginComponent } from './login/login.component';
import { ForgetComponent } from './forget/forget.component';
import { CategoryComponent } from './home/category/category.component';
import { AttachmentsAccessoriesComponent } from './home/attachments-accessories/attachments-accessories.component';
import { FeaturedProductsComponent } from './home/featured-products/featured-products.component';
import { ProductProjectComponent } from './home/product-project/product-project.component';
import { HomecmsComponent } from './home/homecms/homecms.component';
import { PagesComponent } from './pages/pages.component';
import { NewsComponent } from './news/news.component';
import { NewsDetailComponent } from './news/news-detail/news-detail.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { SuccessComponent } from './store/cart/success/success.component';
import {ResetComponent} from "./reset/reset.component";
import {SearchComponent} from "./product/search/search.component";
import {ContactUsComponent} from "./contact-us/contact-us.component";

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'sign-up', component: SignUpComponent},
  { path: 'manufacturer-signup', component: ManufacturerSignupComponent },
  { path: 'thank-you', component: ThankYouComponent },
  { path: 'login', component: LoginComponent },
  { path: 'forget', component: ForgetComponent },
  { path: 'reset/:token', component: ResetComponent },
  { path: 'news', component: NewsComponent},
  { path: 'news-detail', component: NewsDetailComponent},
  { path: 'success', component: SuccessComponent },
  { path: 'account', loadChildren: './account/account.module#AccountModule' },
  { path: 'store', loadChildren:'./store/store.module#StoreModule'},
  //{ path: 'store/:category', loadChildren: './store/store.module#StoreModule' },
  { path: 'product/:slug', loadChildren: './product/product.module#ProductModule' },
  { path: 'cart', loadChildren: './store/cart/cart.module#CartModule' },
  { path: 'checkout', loadChildren: './store/cart/checkout/checkout.module#CheckoutModule' },
  { path: 'payment', loadChildren: './store/cart/payment/payment.module#PaymentModule' },
  { path: 'not-found', component: NotFoundComponent } ,
  { path: 'contact-us', component: ContactUsComponent },
  { path: '**', component: PagesComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
  scrollPositionRestoration: 'enabled'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {
   static component = [
       HomeComponent, HeaderComponent, FooterComponent, SliderComponent, MenuComponent,
       SignUpComponent, LoginComponent, ForgetComponent, ResetComponent, CategoryComponent,
       AttachmentsAccessoriesComponent, FeaturedProductsComponent, ProductProjectComponent, HomecmsComponent,
       PagesComponent, NotFoundComponent, NewsComponent,NewsDetailComponent, ManufacturerSignupComponent,ThankYouComponent,
     SuccessComponent, SearchComponent,ContactUsComponent
   ];
 }

