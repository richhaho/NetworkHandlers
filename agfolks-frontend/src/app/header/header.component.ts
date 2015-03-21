import { Component, OnInit, EventEmitter, HostListener, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
// Slimscroll 
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';

import { CategoryService } from '../services/category/category.service';
import { StoreService } from '../services/store/store.service'
import { UserService } from '../services/auth/user.service'
import { Globals } from '../common/globals';
import { MenuComponent } from './menu/menu.component';

// Import environment config file.
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.sass']
})
export class HeaderComponent implements OnInit {
  slimSOptions: ISlimScrollOptions;
  scrollEvents: EventEmitter<SlimScrollEvent>;
  classPFlag: boolean;
  private wasInside = false;
  CID: Number = environment.config.CID;
  PORTAL_URL: string = environment.config.PORTAL_URL;
  cartProductList: any;
  productCount: Number;
  subTotal: Number;
  UserToken: string;
  userData: any;

  // calling child component method in parent compenent
  @ViewChild(MenuComponent) child: MenuComponent;

  constructor(private globals: Globals, private router: Router,
    private CategoryService: CategoryService,
    private StoreService: StoreService,
    private toastr: ToastrService,
    private translate: TranslateService,
    private UserService: UserService) {

  }

  ngOnInit() {
    // brodcast data for login user
    this.userData = '';
    this.UserService.setUserDataList();
    this.UserService.castUserData.subscribe(userData => {
      this.userData = userData;
      // get user token
      this.UserToken = localStorage.getItem('token');
    });

    // SlimScroll
    this.scrollEvents = new EventEmitter<SlimScrollEvent>();
    this.slimSOptions = Object.assign({}, this.globals.slimSOptions);

    // This service sbucribe cart product list
    this.StoreService.castCartProductList.subscribe(cartProductInfo => {
      // set data
      this.productCount = cartProductInfo.productCount;
      this.cartProductList = cartProductInfo.data;
      this.subTotal = cartProductInfo.subTotal;
      if (cartProductInfo && cartProductInfo.openCart) {
        this.cartSbar = true;
        // Display message 
        this.translate.get('PRODUCT_ADDED_SUCCESSFULLY_IN_CART').subscribe((res: string) => {
          this.toastr.success(res);
        });

      }
    });

    // Calling get cart info method
    this.getProductCartList();
  }

  // sign out
  signOut(): void {
    this.UserService.signOut();
  }

  // redirect to page according to url
  changeRouter(slug): void {
    this.cartSbar = false;
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.navigateByUrl(slug, { replaceUrl: true });
  }

  // Manage class flag true/false;
  togglePMenu() {
    if (!this.classPFlag) {
      this.classPFlag = true;
      this.wasInside = true;
    }
  }

  // Manage host listener 
  @HostListener('document:click', ['$event'])
  clickout() {
    if (!this.wasInside) {
      this.classPFlag = false;
    }
    this.wasInside = false;
  }

  // Get cart info 
  getProductCartList(): void {
    let checkItem: any = localStorage.getItem('SessionID');
    if (checkItem) {
      let dataObj = {
        cid: this.CID,
        SessionID: checkItem
      }
      this.StoreService.getProductCartInfo(dataObj).subscribe(res1 => {
        if (res1 && res1.data && res1.data.length) {
          // emit data with broadcast service
          this.StoreService.setCartProductList(res1);
        }
      }, (error) => {
        // Reset value for service
        this.StoreService.setCartProductList('');
      });
    }
  }

  // remove item from cart 
  removeCartItem(ID: Number): void {
    if (ID) {
      // define object
      let item = {
        cid: this.CID,
        ID: ID
      }
      // calling service
      this.StoreService.removeCartItem(item).subscribe(res => {
        if (res) {
          // refresh cart item
          this.getProductCartList();
          // Display message 
          this.translate.get('PRODUCT_REMOVED_SUCCESSFULLY_FROM_CART').subscribe((res: string) => {
            this.toastr.success(res);
          });
        }
      }, (error) => {
        // Display error 
        this.toastr.error(error.statusText);
      });
    }
  }

  // for cart side bar
  cartSbar: boolean;
  cartSiderBar(): void {
    if (!this.cartSbar) {
      this.cartSbar = true;
    } else {
      this.cartSbar = false;
    }
  }

}
