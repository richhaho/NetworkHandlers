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
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.sass']
})
export class ProfileComponent implements OnInit {
  CID: Number = environment.config.CID;
  PORTAL_URL: string = environment.config.PORTAL_URL;
  UserToken: string;
  userData: any;
  addressList: any;
  currentUser: any;

  constructor(
    private router: Router,
    private UserService: UserService,
    private translate: TranslateService,
    private toastr: ToastrService,
  ) { }

  ngOnInit() {
    // brodcast data for login user
    this.userData = '';
    this.UserService.setUserDataList();
    this.UserService.castUserData.subscribe(userData => {
      this.userData = userData;
      // get user token
      this.UserToken = localStorage.getItem('token');
    });

    // calling multiple method
    forkJoin([ this.getCurrentUser()]);
  }

  // redirect to page according to url
  changeRouter(slug): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.navigateByUrl(slug, { replaceUrl: true });
  }


  // get current user
  getCurrentUser(): void {
    if (this.userData) {
      let dataObj = {
        cid: this.CID,
        userId: this.userData.id
      }
      this.UserService.getCurrentUser(dataObj).subscribe(res => {
        if (res && res.data && res.data.length) {
          this.currentUser = res.data;
        }else{
          this.currentUser = [];
        }
      }, (error) => {
          this.currentUser = [];
      });
    }
  }

  // remove address 
  removeAddress(id:number):void{
    if (id) {
      let dataObj = {
        cid: this.CID,
        id: id
      }
      this.UserService.removeAddress(dataObj).subscribe(res => {
        if (res && res.data) {
          // calling multiple method
          forkJoin([this.getCurrentUser()]);
          // show message
          this.translate.get('ADDRESS_REMOVED_SUCCESSFULLY').subscribe((res: string) => {
            this.toastr.success(res);
          });
        }
      }, (error) => {
      });
    }
  }

}
