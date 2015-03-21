import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import * as uuid from 'uuid';
import * as qs from 'qs';
import { StoreService } from '../../services/store/store.service'
import { SliderService } from '../../services/slider/slider.service'
import { CategoryService } from '../../services/category/category.service'

// Import environment config file.
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-category-count',
  templateUrl: './category-count.component.html',
  styleUrls: ['./category-count.component.sass']
})
export class CategoryCountComponent implements OnInit {
  CID: Number = environment.config.CID;
  PORTAL_URL: string = environment.config.PORTAL_URL;
  productsList: Array<any>;
  newUUid: string;
  sliderData : Array<[]>;
  categoriesData : Array<[]>;
  sliderImage : string;
  sliderTitle : string;
  findSelectedCategories: any;
  categorySlug: string;
  getParams: any;
  categoryList: any;
  
  constructor(
    private StoreService: StoreService,
    private router: Router, 
    private route: ActivatedRoute,
    private translate: TranslateService,
    private SliderService: SliderService,
    private CategoryService: CategoryService
    ) {
    // Set translate language
    translate.setDefaultLang('en');
    // Generate new uuid for product cart
    this.newUUid = uuid.v4();
    this.sliderTitle = 'Shop';
    
  }

  ngOnInit() {
    // calling get store slider method
    this.getSlider();
    this.getCategories();
    
    
    
  }

  // redirect to page according to url
  changeRouter(slug): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.navigateByUrl(slug, { replaceUrl: true });
  }

  
  // Fetch shop slider
  getSlider(): void {
    // Set conditions
    let cond = { 
      cid: this.CID,
      slider_category:8
    };
      this.SliderService.getSystemPageSlider(cond)
      .subscribe(res => {
        if (res && res.data && res.data) {
          
          this.sliderData = (res.data && res.data.length) ? res.data.slider:[]; // Set slider data
          this.sliderImage = (res.data && res.data.length) ? this.PORTAL_URL+'newcms/files/slider/'+this.CID+'/'+res.data[0].slider_image:'./assets/images/background/shop-BG.jpg'; // Set slider data
          this.sliderTitle = (res.data && res.data.length) ? res.data[0].slider_title:'Agfolks Shop'; // Set slider data
        }
      }, (err) => {

      });
  }

  // Fetch shop slider
  getCategories(): void {
    // Set conditions
    let cond = { 
      cid: this.CID,
      parent_category_id:'',
      limit:5
    };
      this.CategoryService.getFeaturedCategories(cond)
      .subscribe(res => {
        if (res && res.data && res.data) {
          this.categoriesData = (res.data && res.data.length) ? res.data:[]; // Set slider data
          // manage all serach filter
          this.checkKeyParam();
        }
      }, (err) => {

      });
  }
  
  checkKeyParam() {
    // get url params
    this.categorySlug = this.route.snapshot.params.category;
    
    
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
        }
      });
    }
    
  }

}
