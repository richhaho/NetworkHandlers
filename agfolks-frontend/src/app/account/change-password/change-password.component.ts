import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

// import service 
import { UserService } from '../../services/auth/user.service'
import { CountriesService } from '../../services/countries/countries.service';
import { MustMatch } from './_helpers/must-match.validator';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.sass']
})
export class ChangePasswordComponent implements OnInit {
  userForm;
  url: string = environment.config.API_URL;
  private CID: Number = environment.config.CID;
  userData: any;
  UserToken: any;

  constructor(
    private UserService: UserService,
    private CountriesService: CountriesService,
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private toastr: ToastrService,
    private translate: TranslateService
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

    // Define user form
    this.userForm = this.formBuilder.group({
      old_passwored: ['', [Validators.required, Validators.minLength(6)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmpass: ['', [Validators.required]],
    },
      {
        validator: MustMatch('password', 'confirmpass')
      });
  }

  onSubmit(customerData) {
    this.markFormGroupDirtied(this.userForm);
    if (this.userForm.valid && this.UserToken && this.userData) {
      customerData['CID'] = this.CID;
      customerData['email'] = this.userData.email;
      customerData['username'] = this.userData.username;
      customerData['token'] = this.UserToken;
      // reset passwored
      this.UserService.updatePassword(customerData).subscribe((res) => {
            // redirect
            this.changeRouter('account/profile');
            // reset form
            this.userForm.reset();
            // message
            this.translate.get('PASSWORD_UPDATED_SUCCESSFULLY').subscribe((res: string) => {
              this.toastr.success(res);
            });
          },
          (error: any) => {
            if (error && error.error && error.error.message) {
              this.toastr.error(error.error.message);
            } else if (error && error.error && error.error.error){
              this.toastr.error(error.error.error);
            }
          }
        );
    } else {
      console.log(this.userForm);
    }
  }
  // form validation 
  private markFormGroupDirtied(formGroup: FormGroup) {
    (<any>Object).values(formGroup.controls).forEach(control => {
      control.markAsDirty();

      if (control.controls) {
        this.markFormGroupDirtied(control);
      }
    });
  }

  // redirect to page according to url
  changeRouter(slug): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.navigateByUrl(slug, { replaceUrl: true });
  }

}
