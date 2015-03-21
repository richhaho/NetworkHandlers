import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

// import service 
import { UserService } from '../../services/auth/user.service'
// Import environment config file.
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-profile',
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.sass']
})
export class OrderHistoryComponent implements OnInit {
  CID: Number = environment.config.CID;
  PORTAL_URL: string = environment.config.PORTAL_URL;
  UserToken: string;
  userData: any;
  OrdersData: Array<any>;
  setTab: string;
  
  constructor(
    private router: Router,
    private UserService: UserService,
    private translate: TranslateService,
    private toastr: ToastrService,
  ) {
    // Set translate language
    translate.setDefaultLang('en');

    // set product detail tabs
    this.setTab = 'All_Orders';
  }

  ngOnInit() {
    // brodcast data for login user
    this.userData = '';
    this.UserService.setUserDataList();
    this.UserService.castUserData.subscribe(userData => {
      this.userData = userData;
      // get user token
      this.UserToken = localStorage.getItem('token');
    });

    // call fucntion for fetch orders
    this.getUserOrders('all');
  }

  // redirect to page according to url
  changeRouter(slug): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.navigateByUrl(slug, { replaceUrl: true });
  }

  // get current user address
  getUserOrders(status): void {
    if (this.userData) {
      let dataObj = {
        cid: this.CID,
        userId: this.userData.id,
        status:status
      }
      this.UserService.getUserOrders(dataObj).subscribe(res => {
        if (res && res.data && res.data.length) {
          this.OrdersData = res.data;
        }else{
          this.OrdersData = [];
        }
      }, (error) => {
        this.OrdersData = [];
      });
    }
  }

  

  

}
