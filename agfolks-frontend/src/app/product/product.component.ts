import { Component, OnInit, TemplateRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { StoreService } from '../services/store/store.service';
import { UserService } from '../services/auth/user.service'
import * as uuid from 'uuid';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
// Declear jquery 
declare var jQuery: any;

// Import environment config file.
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.sass']
})
export class ProductComponent implements OnInit {
  CID: Number = environment.config.CID;
  PORTAL_URL: string = environment.config.PORTAL_URL;
  productSlug: string;
  productInfo: any;
  Product_Accessories:any;
  setTab: string;
  productQuantity: any;
  newUUid: string;
  UserToken: string;
  userData: any;
  modalRef: BsModalRef;
  Wishlists:any;

  constructor(private StoreService: StoreService,
    private router: Router, private translate: TranslateService,
    private route: ActivatedRoute,
    private UserService: UserService,
    private modalService: BsModalService,
    private toastr: ToastrService
    ) {
    // Set translate language
    translate.setDefaultLang('en');

    // set product detail tabs
    this.setTab = 'description';

    // Generate new uuid for product cart
    this.newUUid = uuid.v4();
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.productSlug = params.get("slug");
      // Calling get product details method
      this.get_product_details(this.productSlug);
    });

    // brodcast data for login user
    this.userData = '';
    this.UserService.setUserDataList();
    this.UserService.castUserData.subscribe(userData => {
      this.userData = userData;
      this.userData;
      // get user token
      this.UserToken = localStorage.getItem('token');
    });
    
    this.Wishlists = [];
  }

  // redirect to page according to url
  changeRouter(slug): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.navigateByUrl(slug, { replaceUrl: true });
  }

  // Get product details 
  get_product_details(slug: string): void {
    if (slug) {
      let cond: object = {
        cid: this.CID,
        Product_Slug: slug
      };
      // Calling service
      this.StoreService.getProductDetails(cond).subscribe(res => {
        if (res && res.data && res.data.ID) {
          this.productInfo = res.data;
          this.Product_Accessories = res.data.Product_Accessories;
          console.log(this.Product_Accessories);
          
          let urlImage = this.PORTAL_URL;
          
          if (this.Product_Accessories && this.Product_Accessories.length) {
              _.map(this.productInfo.Product_Accessories, function (v) {
                if (v.Image_type == 'image') {
                  v.imageUrl = (v && v.Image) ? urlImage + 'files/store/products/' + v.CID + '/' + v.Accessory_ID + '/' + v.Image : "./assets/images/no-image.png";
                } else {
                  v.imageUrl = (v && v.Image) ? urlImage + 'files/store/products/' + v.CID + '/' + v.Accessory_ID + '/thumb/' + v.Image : "./assets/images/no-image.png";
                }
                return v;
              })
          }
          //console.log(this.Product_Accessories);
          
          // set product quantity 
          this.productQuantity = 1;
          
          // Manage product slider start here
          jQuery(document).ready(function () {
            // Js product single slider
            jQuery('.js-click-product').slick({
              slidesToShow: 4,
              slidesToScroll: 1,
              asNavFor: '.js-product-slider',
              dots: false,
              focusOnSelect: true,
              infinite: true,
              arrows: true,
              vertical: true,
              responsive: [{
                breakpoint: 1367,
                settings: {
                  vertical: false
                }
              }]
            });
            jQuery('.js-product-slider').slick({
              slidesToShow: 1,
              slidesToScroll: 1,
              arrows: true,
              asNavFor: '.js-click-product'
            });
          })
          // Manage product slider end here
          
        }
      }, (err) => {

      });
    }
  }

  // Add to cart method
  productAddToCart(itemID: any,itemCID: any, qty:Number) {
    // Set sesson id;
    let checkItem: any = localStorage.getItem('SessionID');
    if (!checkItem) {
      checkItem = this.newUUid;
      localStorage.setItem('SessionID', checkItem);
    }
    let addCart = {
      CID: itemCID,
      MemberID: (this.userData && this.userData.id) ? this.userData.id : '',
      SessionID: checkItem,
      Cart_Date: new Date(),
      Product_ID: itemID,
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

  // manage prodcut quentity 
  manageProductQuantity(quantity, status): void {
    if (this.productQuantity > 0) {
      if (status) {
       (this.productQuantity == quantity) ? quantity : this.productQuantity++;
      } else {
        (this.productQuantity > 1) ? this.productQuantity-- : this.productQuantity;
      }
    }
  }
  
  // for model 
  openModal(template: TemplateRef<any>) {
    console.log(template);
    this.modalRef = this.modalService.show(template);
  }
  
  // add to wishlist
  AddtoWishlist(ID:Number,Slug:String,WishlistModal) {
    // Set sesson id;
    if (!(this.userData)){
        let slug = "login?redirect=product&slug="+Slug;
        this.changeRouter(slug);
    }
    let addWishlist = {
      CID: this.CID,
      userId: (this.userData && this.userData.id) ? this.userData.id : '',
      Product_ID: ID,
      Wishlist_ID:0
    }
    this.UserService.addToWishlist(addWishlist).subscribe(res => {
      // Check data 
      if (res && res.data) {
        console.log(res.data);
        // Display message 
        this.translate.get('PRODUCT_IN_WISHLIST_ADDED_SUCCESSFULLY').subscribe((res: string) => {
            this.toastr.success(res);
        });

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
        this.openModal(WishlistModal);
      }

    }, (err) => {
        if (err.error.error) {
          this.toastr.error(err.error.error);
          this.getWishlists();
          this.openModal(WishlistModal);
        }
    });
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
        }
      }, (error) => {
          this.Wishlists = [];
      });
    }
  }

}
