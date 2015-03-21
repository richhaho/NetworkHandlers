import { Component, OnInit } from '@angular/core';
import {CategoryService} from "../../services/category/category.service";
import {StoreService} from "../../services/store/store.service";
import {environment} from "../../../environments/environment";
import {Router} from "@angular/router";

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.sass']
})
export class SearchComponent implements OnInit {

  categoryList: any;
  itemCategory: string;
  CID: Number = environment.config.CID;
  selectedCategoryId: number;
  productsList: Array<any>;
  isSuggestionVisible: boolean;
  searchTxt: string;
  constructor(
      private CategoryService: CategoryService,
      private StoreService: StoreService,
      private router: Router,
  ) { }

  ngOnInit() {
    // This service subscribe category list
    this.CategoryService.castCategory.subscribe(categoryList => {
      
      this.categoryList = categoryList;
      //this.categoryList.unshift({ID:-1, Category_Name: "Select Category"})
    });
  }

  // Set category item for search products
  setCategory(item: any): void {
    this.itemCategory = (item && item.Category_Name) ? item.Category_Name : '';
    let slug = 'store?product_cat=';
    if (item && item.ID && item.ID != -1) { // category is selected
      slug += item['Category_Slug'];
      this.selectedCategoryId = item.ID;
    } else { // no selected(All)
      slug += '0';
      this.selectedCategoryId = -1;
    }
    // this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    // this.router.navigateByUrl(slug, { replaceUrl: true });
    // this.reset();
  }

  onSearchChange(searchValue) {
    if (searchValue.length > 0) {
      let cond: object = {
        cid: this.CID,
        categoryId: this.selectedCategoryId,
        name: searchValue
      };
      this.StoreService.searchProducts(cond).subscribe(res => {
        if (res && res.data) {
          this.productsList = (res.data.length) ? res.data : [];
          this.isSuggestionVisible = true;
        }
      }, (err) => {
        console.log('error', err);
        this.isSuggestionVisible = false;
      })
    } else {
      this.isSuggestionVisible = false;
    }
  }

  changeRouter(slug): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.navigateByUrl(slug, { replaceUrl: true });
    this.reset();
  }

  reset() {
    this.isSuggestionVisible = false;
    this.searchTxt = '';
  }

}
