import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import * as uuid from 'uuid';
import * as qs from 'qs';
import { StoreService } from '../services/store/store.service'
import { SliderService } from '../services/slider/slider.service'
import { UserService } from '../services/auth/user.service'

// Import environment config file.
import { environment } from 'src/environments/environment';
import {CategoryService} from "../services/category/category.service";

@Component({
  selector: 'app-store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.sass']
})
export class StoreComponent implements OnInit {
  CID: Number = environment.config.CID;
  PORTAL_URL: string = environment.config.PORTAL_URL;
  productsList: Array<any>;
  newUUid: string;
  sliderData : Array<[]>;
  UserToken: string;
  userData: any;
  categorySlug: string;
  categoryList: any;
  findSelectedCategories: any;
  limit: number = 12;
  cond:any;
  totalItems:number=0;
  currentPage :number=0;
  ProductPerRow :4;
  priceQueryString: any;
  getParams: any;
  typeQueryString: any;
  manufacturerQueryString : any;
  sorFilter: number;
  productNFound : boolean = false;

  constructor(
    private StoreService: StoreService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private SliderService: SliderService,
    private UserService: UserService,
    private CategoryService: CategoryService,
    ) {
    // Set translate language
    translate.setDefaultLang('en');
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
    // manage all serach filter
    this.checkKeyParam();
    
    this.ProductPerRow = 4;
  }

  checkKeyParam() {
    // get url params
    this.categorySlug = this.route.snapshot.params.category;
    // get query string
    this.getParams = this.route.snapshot.queryParamMap;
    this.getParams = qs.parse(this.getParams.params);
    // check qeury price
    if (this.getParams && this.getParams.price) {
      // set price params 
      this.priceQueryString = this.getParams.price;
    }
    // check qeury type
    if (this.getParams && this.getParams.type) {
      // set type params 
      this.typeQueryString = this.getParams.type;
    }
    // check qeury manufacturer
    if (this.getParams && this.getParams.manufacturer) {
      // set type params 
      this.manufacturerQueryString = this.getParams.manufacturer;
    }

    if (this.categorySlug) {
      this.CategoryService.castCategory.subscribe(categoryList => {
        this.categoryList = categoryList;
        if(this.categoryList && this.categoryList.length){
          this.categoryList.forEach(element => {
            if((!element.childrenMenu || !element.childrenMenu.length) && (element.Category_Slug == this.categorySlug)){
              this.findSelectedCategories = element
            }else{
              if(element.Category_Slug == this.categorySlug){
                this.findSelectedCategories = element
              }else{
                element.childrenMenu.forEach(element => {
                  if(element.Category_Slug == this.categorySlug){
                    this.findSelectedCategories = element
                  }else{
                    element.childrenMenu.forEach(element => {
                      if(element.Category_Slug == this.categorySlug){
                        this.findSelectedCategories = element
                      }else{
                        element.childrenMenu.forEach(element => {
                          if(element.Category_Slug == this.categorySlug){
                            this.findSelectedCategories = element
                          }else{
                            element.childrenMenu.forEach(element => {
                              if(element.Category_Slug == this.categorySlug){
                                this.findSelectedCategories = element
                              }else{
                                element.childrenMenu.forEach(element => {
                                  if(element.Category_Slug == this.categorySlug){
                                    this.findSelectedCategories = element
                                  }else{
                                    element.childrenMenu.forEach(element => {
                                      if(element.Category_Slug == this.categorySlug){
                                        this.findSelectedCategories = element
                                      }else{
                                        element.childrenMenu.forEach(element => {
                                          if(element.Category_Slug == this.categorySlug){
                                            this.findSelectedCategories = element
                                          }else{
                                            element.childrenMenu.forEach(element => {
                                              if(element.Category_Slug == this.categorySlug){
                                                this.findSelectedCategories = element
                                              }
                                            });
                                          }
                                        });
                                      }
                                    });
                                  }
                                });
                              }
                            });
                          }
                        });
                      }
                    });
                  }
                });
              }
            }
          });
          //console.log(this.findSelectedCategories);
          let catIdx = -1;
        
          if(this.findSelectedCategories){
            catIdx = this.findSelectedCategories.ID;
          }
          this.cond = {
            cid: this.CID,
            categorySlug: this.categorySlug,
            id: catIdx
          }
          this.get_products_list();
        }
        
      });
    } else {
      this.cond = {
        cid: this.CID
      }
      this.get_products_list();
    }
    
  }

  // redirect to page according to url
  changeRouter(slug): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.navigateByUrl(slug, { replaceUrl: true });
  }

  // Get store list
  get_products_list(event?:any, limitChanged?:any) {
    // set status 
    this.productNFound = false;
    // Calling service
    if(limitChanged){
      this.totalItems=0;
      this.currentPage=0;
    }
    if(this.limit != 1000){
      this.cond.limit=this.limit;
    }
    if(event && event.page){
      this.cond.page=event.page;
    }else{
      this.cond.page = 1;
    }
    // if price filter
    if (this.priceQueryString){
      this.cond.price = this.priceQueryString
    }
    // if type filter
    if (this.typeQueryString && this.typeQueryString.length) {
      this.cond.type = this.typeQueryString
    }
    // check qeury manufacturer
    if (this.manufacturerQueryString && this.manufacturerQueryString.length) {
      // set type params 
      this.cond.manufacturer = this.manufacturerQueryString;
    }
    // sorting filters ASC/DESC
    this.cond.sorting = (this.sorFilter) ? this.sorFilter : 0;

    // get product list 
    this.StoreService.getProductsList(this.cond).subscribe(res => {
      if (res && res.data) {
        this.productsList = (res.data.length) ? res.data : [];
        this.totalItems = res.total;
        let urlImage = this.PORTAL_URL;
        let companyCID = this.CID;
        this.productNFound = (res.total)? false : true;
        if (this.productsList && this.productsList.length) {
          _.map(this.productsList, function (v) {
            if (v.Image_type == 'image') {
              v.imageUrl = (v && v.Image) ? urlImage + 'files/store/products/' + v.CID + '/' + v.ID + '/' + v.Image : "./assets/images/no-image.png";
            } else {
              v.imageUrl = (v && v.Image) ? urlImage + 'files/store/products/' + v.CID + '/' + v.ID + '/thumb/' + v.Image : "./assets/images/no-image.png";
            }
            return v;
          })
        }
      }else{
        this.productNFound = true;
      }
    }, (err) => {
        this.productNFound = true;
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
  
  
  // Get store list
  ChangeGrid(count_per_product) {
    this.ProductPerRow = count_per_product;
  }
  // shop filters this method calling by child component(product-filter.component)
  shopFilters($event) {

  }

  // for sorting filter ASC/DESC
  sortingFilter(event):void{
    this.sorFilter = event.target.value;
    // calling product list method
    this.get_products_list();
  }
}
