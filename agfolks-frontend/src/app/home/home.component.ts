import { Component, OnInit } from '@angular/core';
import { HomeService } from '../services/home/home.service'
// Import environment config file.
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.sass']
})
export class HomeComponent implements OnInit {
  cmsPageData: Array<[]>;
  sliderData : Array<[]>;
  CID: number = environment.config.CID;
  constructor(
    private HomeService: HomeService) {

  }
  ngOnInit() {
    // calling method
    this.getCmsPage();
  }

  // Fetch cms page detail data
  getCmsPage(): void {
    // Set conditions
    let cond = { 
      cid: this.CID,
      home_page_flag:1
    };
      this.HomeService.getCmsPage(cond)
      .subscribe(res => {
        if (res && res.data && res.data && res.data.pageData) {
          this.cmsPageData = res.data.pageData // Set page data
          this.sliderData = (res.data.slider && res.data.slider.length) ? res.data.slider:[]; // Set slider data
        }
      }, (err) => {

      });
  }

}
