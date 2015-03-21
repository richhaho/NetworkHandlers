import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import * as uuid from 'uuid';
import { TranslateService } from '@ngx-translate/core';

// import service 
import { UserService } from '../../services/auth/user.service';
import { StoreService } from '../../services/store/store.service';
// Import environment config file.
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-profile',
  templateUrl: './wish-list.component.html',
  styleUrls: ['./wish-list.component.sass']
})
export class WishListComponent implements OnInit {
  CID: Number = environment.config.CID;
  PORTAL_URL: string = environment.config.PORTAL_URL;
  UserToken: string;
  userData: any;
  Wishlists: any;
  currentUser: any;
  newUUid: string;

  constructor(
    private router: Router,
    private UserService: UserService,
    private StoreService: StoreService,
    private translate: TranslateService,
    private toastr: ToastrService,
  ) { }

  ngOnInit() {
    // brodcast data for login user
    this.userData = '';
    this.UserService.setUserDataList();
    this.UserService.castUserData.subscribe(userData => {
      this.userData = userData;
      // get user token
      this.UserToken = localStorage.getItem('token');
    });
    
    // Generate new uuid for product cart
    this.newUUid = uuid.v4();

    // calling multiple method
    forkJoin([this.getWishlists(), this.getCurrentUser()]);
  }

  // redirect to page according to url
  changeRouter(slug): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.navigateByUrl(slug, { replaceUrl: true });
  }

  // get current user address
  getWishlists(): void {
    if (this.userData) {
      let dataObj = {
        cid: this.CID,
        userId: this.userData.id
      }
      this.UserService.getWishlist_Products(dataObj).subscribe(res => {
        if (res && res.data && res.data.length) {
          this.Wishlists = res.data;
          let urlImage = this.PORTAL_URL;
          if (this.Wishlists && this.Wishlists.length) {
              _.map(this.Wishlists, function (v) {
                if (v.Image_type == 'image') {
                  v.imageUrl = (v && v.Image) ? urlImage + 'files/store/products/' + v.Product_CID + '/' + v.Product_ID + '/' + v.Image : "./assets/images/no-image.png";
                } else {
                  v.imageUrl = (v && v.Image) ? urlImage + 'files/store/products/' + v.Product_CID + '/' + v.Product_ID + '/thumb/' + v.Image : "./assets/images/no-image.png";
                }
                return v;
              })
          }
        }else{
          this.Wishlists = [];
        }
      }, (error) => {
          this.Wishlists = [];
      });
    }
  }

  // get current user
  getCurrentUser(): void {
    if (this.userData) {
      let dataObj = {
        cid: this.CID,
        userId: this.userData.id
      }
      this.UserService.getCurrentUser(dataObj).subscribe(res => {
        if (res && res.data && res.data.length) {
          this.currentUser = res.data;
        }
      }, (error) => {
      });
    }
  }
  
  // Add to cart method
  productAddToCart(item: any, qty: Number) {
    // Set sesson id;
    let checkItem: any = localStorage.getItem('SessionID');
    if (!checkItem) {
      checkItem = this.newUUid;
      localStorage.setItem('SessionID', checkItem);
    }
    let addCart = {
      CID: item.Product_CID,
      MemberID: (this.userData && this.userData.id) ? this.userData.id : '',
      SessionID: checkItem,
      Cart_Date: new Date(),
      Product_ID: item.Product_ID,
      Product_Count: qty
    }
    this.StoreService.tmpAddToProduct(addCart).subscribe(res => {
      // Check data 
      if (res && res.data && res.data && res.data.SessionID) {
        // Get product cart info
        let dataObj = {
          cid: res.data.CID,
          SessionID: res.data.SessionID
        }
        this.StoreService.getProductCartInfo(dataObj).subscribe(res1 => {
          if (res1 && res1.data && res1.data.length) {
            res1.openCart = true;
            // emit data with broadcast service
            this.StoreService.setCartProductList(res1);
          }
        }, (error) => {

        });
      }

    }, (err) => {
        this.toastr.error(err.error.error);
    });
  }

  // Add to cart method
  RemoveFromWishlist(ID: Number) {
    // Set sesson id;
    let addCart = {
      CID: this.CID,
      MemberID: (this.userData && this.userData.id) ? this.userData.id : '',
      ID: ID
    }
    this.UserService.removeProductFromWishlist(addCart).subscribe(res => {
      // Check data 
      if (res && res.data) {
        // Display message 
        this.translate.get('PRODUCT_REMOVED_WISHLIST_MSG').subscribe((res: string) => {
            this.toastr.success(res);
        });
        
        this.getWishlists();
      }

    }, (err) => {

    });
  }


}
