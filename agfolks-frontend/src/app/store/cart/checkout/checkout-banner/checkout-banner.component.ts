import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { StoreService } from '../../../../services/store/store.service';
// Import environment config file.
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-checkout-banner',
  templateUrl: './checkout-banner.component.html',
  styleUrls: ['./checkout-banner.component.sass']
})
export class CheckoutBannerComponent implements OnInit {

  constructor(private StoreService: StoreService,
    private router: Router, private translate: TranslateService,
    private route: ActivatedRoute) {
    // Set translate language
    translate.setDefaultLang('en');
  }

  ngOnInit() {
  }

  // redirect to page according to url
  changeRouter(slug): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.navigateByUrl(slug, { replaceUrl: true });
  }

}
