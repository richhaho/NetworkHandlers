import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

// Import environment config file.
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-cart-banner',
  templateUrl: './cart-banner.component.html',
  styleUrls: ['./cart-banner.component.sass']
})
export class CartBannerComponent implements OnInit {
  CID: Number = environment.config.CID;
  PORTAL_URL: string = environment.config.PORTAL_URL;
  cartProductList: any;
  productCount: Number;
  subTotal: Number;
  constructor(private router: Router) { }

  ngOnInit() {
  }
  // redirect to page according to url
  changeRouter(slug): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.navigateByUrl(slug, { replaceUrl: true });
  }
}
