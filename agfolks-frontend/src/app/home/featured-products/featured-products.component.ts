import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { StoreService } from '../../services/store/store.service'
import * as uuid from 'uuid';
import { UserService } from '../../services/auth/user.service'


// Import environment config file.
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-featured-products',
  templateUrl: './featured-products.component.html',
  styleUrls: ['./featured-products.component.sass']
})
export class FeaturedProductsComponent implements OnInit {
  CID: Number = environment.config.CID;
  PORTAL_URL: string = environment.config.PORTAL_URL;
  storeList: Array<any>;
  newUUid: string;
  UserToken: string;
  userData: any;

  constructor(private StoreService: StoreService, 
    private router: Router,
    private UserService: UserService) { 
    // Generate new uuid for product cart
    this.newUUid = uuid.v4();
    }

  ngOnInit() {
    // brodcast data for login user
    this.userData = '';
    this.UserService.setUserDataList();
    this.UserService.castUserData.subscribe(userData => {
      this.userData = userData;
      this.userData;
      // get user token
      this.UserToken = localStorage.getItem('token');
    });

    // Calling store list method
    this.get_store_list();
  }

  // redirect to page according to url
  changeRouter(slug): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.navigateByUrl(slug, { replaceUrl: true });
  }

  // Get store list
  get_store_list(): void {
    let cond: object = {
      cid: this.CID,
      limit: 5
    };
    // Calling service
    this.StoreService.getStorelist(cond).subscribe(res => {
      if (res && res.data) {
        this.storeList = (res.data.length) ? res.data : [];
        let urlImage = this.PORTAL_URL;
        let companyCID = this.CID;
        if (this.storeList && this.storeList.length) {
          _.map(this.storeList, function (v) {
            if (v.Image_type == 'image') {
              v.imageUrl = (v && v.Image) ? urlImage + 'files/store/products/' +  v.CID + '/' + v.ID + '/' + v.Image : "./assets/images/no-image.png";
            } else {
              v.imageUrl = (v && v.Image) ? urlImage + 'files/store/products/' +  v.CID + '/' + v.ID + '/thumb/' + v.Image : "./assets/images/no-image.png";
            }
            return v;
          })
        }

      }
    }, (err) => {

    })
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
      CID: item.CID,
      MemberID: (this.userData && this.userData.id) ? this.userData.id : '',
      SessionID: checkItem,
      Cart_Date: new Date(),
      Product_ID: item.ID,
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

    });
  }

}
