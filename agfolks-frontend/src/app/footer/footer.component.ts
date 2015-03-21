import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CategoryService } from '../services/category/category.service';
import {HomeService} from '../services/home/home.service'

// Import environment config file.
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.sass']
})
export class FooterComponent implements OnInit {
  CID: number = environment.config.CID;
  PORTAL_URL: string = environment.config.PORTAL_URL;
  categoryList: any = [];
  footerMList: Array<[]>;

  constructor(
    private CategoryService: CategoryService,
    private router : Router,
    private HomeService: HomeService
  ) { }

  ngOnInit() {
    // This service subscribe category list
    this.CategoryService.castCategory.subscribe(categoryList => this.categoryList = categoryList);
    // Calling footer menu method
    this.getFooterMenuList();
  }

  // redirect to page according to url
  changeRouter(slug): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.navigateByUrl(slug, { replaceUrl: true });
  }
  // Fetch menus method
  getFooterMenuList(): void {
    // Set conditions
    let cond = {
      cid: this.CID
    };
    this.HomeService.getFooterMenu(cond)
      .subscribe(res => {
        if (res && res.data && res.data.length) {
          this.footerMList = res.data // Set menu list
        }
      }, (err) => {

      });
  }

}
