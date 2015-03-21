import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Options } from 'ng5-slider';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { forkJoin } from 'rxjs'
import * as qs from 'qs';

import { CategoryService } from '../../services/category/category.service';
import { StoreService } from '../../services/store/store.service';
// Import environment config file.
import { environment } from 'src/environments/environment';
// Declear jquery 
declare var jQuery: any;

@Component({
  selector: 'app-product-filter',
  templateUrl: './product-filter.component.html',
  styleUrls: ['./product-filter.component.sass']
})
export class ProductFilterComponent implements OnInit {
  CID: number = environment.config.CID;
  PORTAL_URL: string = environment.config.PORTAL_URL;
  menuList: any;
  categoryList: any;
  minValue: number;
  maxValue: number;
  categorySlug: string;
  optionsRangeSlider: Options;
  minAMaxPPrice: any;
  manufacturers: any;
  productAttribute: any;
  priceQueryString: any;
  getParams: any;
  typeQueryString: any;
  manufacturerQueryString: any;

  // define events 
  @Output() dataEvent = new EventEmitter<any>();

  constructor(
    private CategoryService: CategoryService,
    private router: Router,
    private route: ActivatedRoute,
    private StoreService: StoreService
  ) {
    // range slider options
    this.minValue = 0;
    this.maxValue = 200;
    this.optionsRangeSlider = {
      hidePointerLabels: true,
      hideLimitLabels: true,
      floor: 0,
      ceil: 500,
      getSelectionBarColor: (value: number): string => { return '#7D9A3D' },
      getPointerColor: (value: number): string => { return '#7D9A3D' },
    }
  }

  ngOnInit() {
    // This service subscribe category list
    this.CategoryService.castCategory.subscribe(categoryList => {
      this.categoryList = categoryList;
    });

    // category sider bar
    jQuery(document).ready(function () {
      jQuery('.sidebar--widget__categories').on('click', 'li > span', function (e) {

        if (jQuery(this).next().hasClass('sub-menu') == false) { }

        var parent = jQuery(this).parent().parent();
        var the = jQuery(this);

        parent.children('li.open').children('span').children('.arrow').removeClass('open');
        parent.children('li.open').children('.sub-menu').slideUp(200);
        parent.children('li.open').removeClass('open');

        var sub = jQuery(this).next();
        var slideOffeset = -200;
        var slideSpeed = 200;

        if (sub.is(":visible")) {
          jQuery('.arrow', jQuery(this)).removeClass("open");
          jQuery(this).parent().removeClass("open");
          sub.slideUp(slideSpeed, function () { });
        } else {
          jQuery('.arrow', jQuery(this)).addClass("open");
          jQuery(this).parent().addClass("open");
          sub.slideDown(slideSpeed, function () { });
        }
      });
    });

    // calling multiple method 
    forkJoin([this.getStoreAttributes(), this.checkParams()]);
  }

  // check params
  checkParams(): void {
    // get category params
    this.categorySlug = this.route.snapshot.params.category;
    let setCategorySlug = this.categorySlug;
    if (setCategorySlug) {
      setTimeout(() => {
        jQuery(document).ready(function () {
          let attIds = '#' + setCategorySlug;
          jQuery(attIds).parent('li').addClass("open");
          jQuery(attIds).parent().children('.sub-menu').css("display", "block");

          jQuery(attIds).parent('li').parents().addClass("open");
          jQuery(attIds).parent().parents().children('.sub-menu').css("display", "block");

          jQuery(attIds).parent('li').parents().parents().addClass("open");
          jQuery(attIds).parent().parents().parents().children('.sub-menu').css("display", "block");

          jQuery(attIds).parent('li').parents().parents().parents().addClass("open");
          jQuery(attIds).parent().parents().parents().parents().children('.sub-menu').css("display", "block");

          jQuery(attIds).parent('li').parents().parents().parents().parents().addClass("open");
          jQuery(attIds).parent().parents().parents().parents().parents().children('.sub-menu').css("display", "block");

          jQuery(attIds).parent('li').parents().parents().parents().parents().parents().addClass("open");
          jQuery(attIds).parent().parents().parents().parents().parents().parents().children('.sub-menu').css("display", "block");

          jQuery(attIds).parent('li').parents().parents().parents().parents().parents().parents().addClass("open");
          jQuery(attIds).parent().parents().parents().parents().parents().parents().parents().children('.sub-menu').css("display", "block");

          jQuery(attIds).parent('li').parents().parents().parents().parents().parents().parents().parents().addClass("open");
          jQuery(attIds).parent().parents().parents().parents().parents().parents().parents().parents().children('.sub-menu').css("display", "block");
        });
      }, 1000);
    }
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
      var addClasstype = this.typeQueryString;
      // for adding class
      setTimeout(() => {
        jQuery(document).ready(function () {
          jQuery.each(addClasstype, function (index, v) {
            var idType = v.ID + v.Field_Name + v.dataId;
            jQuery('#' + idType).addClass("active");
          });
        });
      }, 1000);
    }
    // check qeury manufacturer
    if (this.getParams && this.getParams.manufacturer) {
      // set type params 
      this.manufacturerQueryString = this.getParams.manufacturer;
    }
  }

  // get store attributes 
  getStoreAttributes(): void {
    let cond = {
      cid: this.CID
    }
    this.StoreService.getStoreAttributes(cond).subscribe(res => {
      // Check data 
      if (res && res.data) {
        this.productAttribute = res.data;
        // set attributes
        let setProductAttributes = _.clone(this.productAttribute);
        let typeQuery = _.clone(this.typeQueryString);
        _.map(setProductAttributes, function (v) {
          if (typeQuery && typeQuery.length) {
            let getObject = _.find(typeQuery, { 'ID': String(v.ID) });
            if (getObject) {
              v.class = true;
            } else {
              v.class = false;
            }
          } else {
            v.class = false;
          }
          return v;
        });
        this.productAttribute = setProductAttributes;
      }

      // set slider option dynamically according to min/max price
      if (res && res.price) {
        this.minAMaxPPrice = res.price;
        // set slider when price from filter
        if (this.priceQueryString) {
          // re set slider value
          setTimeout(() => {
            this.minValue = this.priceQueryString.minValue;
            this.maxValue = this.priceQueryString.maxValue
          }, 500);

        } else {
          this.minValue = this.minAMaxPPrice.min_price;
          this.maxValue = this.minAMaxPPrice.min_price + 200;
        }
        // set slider
        this.optionsRangeSlider = {
          hidePointerLabels: true,
          hideLimitLabels: true,
          floor: 0,
          ceil: Number(this.minAMaxPPrice.max_price),
          getSelectionBarColor: (value: number): string => { return '#7D9A3D' },
          getPointerColor: (value: number): string => { return '#7D9A3D' },
        }
      }

      // set manufacturers list
      if (res && res.manufacturers) {
        this.manufacturers = res.manufacturers;
      }
    }, (err) => {
    });
  }

  // this method set data parent component
  shopFilters(): void {
    let message = { name: '' };
    this.dataEvent.emit(message);
  }

  // redirect to page according to url
  changeRouter(slug): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.navigateByUrl(slug, { replaceUrl: true });
  }
  // category filter 
  productFilter(event, data, type): void {
    let redirectURL = 'store/';
    let urlQueryString: any = {};

    // this section for category
    if (type == 'category' || this.categorySlug) {
      // change category slug
      if (data && data.Category_Slug) {
        redirectURL += data.Category_Slug;
      } else {
        // previous category slug 
        redirectURL += this.categorySlug;
      }
    }

    // this section for price
    if (type == 'price' || this.priceQueryString) {
      if (data && data.minValue) {
        urlQueryString.price = {
          minValue: data.minValue,
          maxValue: data.maxValue
        };
      } else {
        urlQueryString.price = this.priceQueryString;
      }
    }

    // this section for all type 
    if (type == 'type' || this.typeQueryString) {
      let typeObj = [];
      if (data && type == 'type') {
        // check previous data
        if (this.typeQueryString && this.typeQueryString.length) {
          // find data in previous query string
          let getObject = _.find(this.typeQueryString, { 'Options': String(data.Options) });
          if (!getObject) {
            typeObj = [data];
          } else {
            // remove array according to index
            let rmIndex = _.findIndex(this.typeQueryString, function (v) {
              return (v["ID"] === getObject.ID && v["Options"] === getObject.Options);
            });
            this.typeQueryString.splice(rmIndex, 1);
          }
        } else {
          typeObj = [data];
        }
      }
      // sert previous filter
      let prevFObject = [];
      if (this.typeQueryString && this.typeQueryString.length) {
        prevFObject = this.typeQueryString;
      }
      // set params for filter types
      urlQueryString.type = prevFObject.concat(typeObj);
    }

    // this section for all type 
    if (type == 'manufacturer' || this.manufacturerQueryString) {
      let typeMObj = [];
      if (data && type == 'manufacturer') {
        // check previous data
        if (this.manufacturerQueryString && this.manufacturerQueryString.length) {
          // find data in previous query string
          let getObject = _.find(this.manufacturerQueryString, function (o) { return String(o) == String(data.ID); });
          if (!getObject) {
            typeMObj = [data.ID];
          } else {
            // remove array according to index
            let rmIndex = _.findIndex(this.manufacturerQueryString, function (v) {
              return (v["ID"] === getObject.ID);
            });
            this.manufacturerQueryString.splice(rmIndex, 1);
          }
        } else {
          typeMObj = [data.ID];
        }
      }
      // current params
      let prevMObject = [];
      if (this.manufacturerQueryString && this.manufacturerQueryString.length) {
        prevMObject = this.manufacturerQueryString;
      }
      urlQueryString.manufacturer = prevMObject.concat(typeMObj);
    }
    // creating URL
    if (urlQueryString) {
      redirectURL += '?' + qs.stringify(urlQueryString);
    }
    // change url
    this.changeRouter(redirectURL);
  }
}
