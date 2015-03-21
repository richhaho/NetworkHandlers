import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../services/auth/user.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { from } from 'rxjs';

import { StoreService } from '../services/store/store.service'
// Import environment config file.
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.sass']
})
export class LoginComponent implements OnInit {
  loginForm;
  keyParms: string;
  CID: Number = environment.config.CID;
  
  constructor(
    private userService: UserService,
    private router: Router,
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private toastr: ToastrService,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private StoreService: StoreService
  ) { }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
    // get url params for params
    this.route.queryParamMap.subscribe(queryParams => {
      this.keyParms = queryParams.get("redirect");
    })
  }
  onSubmit(customerData) {
    this.markFormGroupDirtied(this.loginForm);
    if (this.loginForm.valid) {
      this.userService.loginUser(customerData).subscribe(resp => {
        if (resp && resp.token && resp.data) {
          // displaying message 
          this.translate.get('LOGIN_SUCCESSFULLY').subscribe((res: string) => {
            this.toastr.success(res);
          });
          // reset form
          this.loginForm.reset();
          // set data in localstorage
          localStorage.setItem('token', resp.token);
          localStorage.setItem('user', JSON.stringify(resp.data));
          // set user data using service
          this.userService.setUserDataList();

          // update member id against added product in cart
          let checkItem: any = localStorage.getItem('SessionID');
          if (checkItem) {
            let dataObj = {
              CID: this.CID,
              SessionID: checkItem,
              MemberID: resp.data.id
            }
            // update member 
           this.StoreService.updateMemberId(dataObj).subscribe(res1 => {
            }, (error) => {
            });
          }
          // redirect   
          setTimeout(() => {
            // redirect according to query string 
            if(this.keyParms){
              this.changeRouter(this.keyParms);
            } else{
              // redirect on fix url
              this.changeRouter('account');
            }
          }, 100);
        } else {

        }
      }, (error: any) => {
        if (error.error.error) {
          this.toastr.error(error.error.error);
        }
      });
    } else {
      console.log(this.loginForm);
    }
  }

  // redirect to page according to url
  changeRouter(slug): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.navigateByUrl(slug, { replaceUrl: true });
  }
  private markFormGroupDirtied(formGroup: FormGroup) {
    (<any>Object).values(formGroup.controls).forEach(control => {
      control.markAsDirty();

      if (control.controls) {
        this.markFormGroupDirtied(control);
      }
    });
  }

}
