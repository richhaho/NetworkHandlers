import { Component, OnInit } from '@angular/core';
import { HomeService } from '../services/home/home.service'
import { Router } from '@angular/router';
// Import environment config file.
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-pages',
  templateUrl: './pages.component.html',
  styleUrls: ['./pages.component.sass']
})
export class PagesComponent implements OnInit {

  cmsPageData: Array<[]>;
  sliderData: Array<[]>;
  CID: number = environment.config.CID;
  private path: any;
  constructor(
    private HomeService: HomeService,
    private router: Router) {
  }
  ngOnInit() {
    // calling method
    this.getCmsPage();
  }

  // Fetch cms page detail data
  getCmsPage(): void {
    // mange slug
    this.path = this.router.url;
    this.path = this.path.slice(0, this.path.indexOf('?') === -1 ? this.path.length : this.path.indexOf('?'));
    this.path = this.path.replace(/^\/|\/$/g, '');

    // Set conditions
    let cond = {
      cid: this.CID,
      page_name: this.path.toLowerCase()
    };
    this.HomeService.getCmsPage(cond)
      .subscribe(res => {
        if (res && res.data && res.data && res.data.pageData) {
          this.cmsPageData = res.data.pageData // Set page data
          this.sliderData = (res.data.slider && res.data.slider.length) ? res.data.slider : []; // Set slider data
        }else{
          this.cmsPageData = [];
          this.sliderData = [];
          this.router.navigateByUrl('/not-found', { replaceUrl: true });
        }
      }, (err) => {

      });
  }

  // redirect to page according to url
  changeRouter(slug): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.navigateByUrl(slug, { replaceUrl: true });
  }

}
