import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

// import service 
import { UserService } from '../../services/auth/user.service'
// Import environment config file.
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-profile',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.sass']
})
export class OrderDetailsComponent implements OnInit {
  CID: Number = environment.config.CID;
  PORTAL_URL: string = environment.config.PORTAL_URL;
  UserToken: string;
  userData: any;
  OrderData: any;
  setTab: string;
  OrderID: any;
  ShowThanks: any;
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
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
    
    this.ShowThanks =  false;
    this.route.paramMap.subscribe(params => {
        this.OrderID = params.get("id");
        // call fucntion for fetch orders
        this.getOrderDetails();
        
    });
    
    // check if user just posted an order
    if(this.route.snapshot.queryParamMap.get("Order")){
        this.ShowThanks =  true;
    }
    
    
  }

  // redirect to page according to url
  changeRouter(slug): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.navigateByUrl(slug, { replaceUrl: true });
  }

  // get current user address
  getOrderDetails(): void {
    if (this.userData && this.userData.id && this.OrderID) {
      let dataObj = {
        cid: this.CID,
        userId: this.userData.id,
        OrderID:this.OrderID
      }
      this.UserService.getOrderDetails(dataObj).subscribe(res => {
        if (res && res.data && res.data.length) {
          this.OrderData = res.data[0];
        }else{
            this.changeRouter('store');
        }
      }, (error) => {
          this.OrderData = [];
      });
    }
  }

  

  

}
