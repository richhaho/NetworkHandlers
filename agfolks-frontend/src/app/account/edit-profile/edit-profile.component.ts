import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

// import service 
import { UserService } from '../../services/auth/user.service'
import { CountriesService } from '../../services/countries/countries.service';


@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.sass']
})
export class EditProfileComponent implements OnInit {

  userForm;
  url: string = environment.config.API_URL;
  private CID: Number = environment.config.CID;
  CountriesList: any;
  statesList: any;
  userData: any;
  currentUser: any;
  UserToken: any;

  constructor(
    private UserService: UserService,
    private CountriesService: CountriesService,
    private router: Router,
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
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      address2: [''],
      state: ['', [Validators.required]],
      city: ['', [Validators.required]],
      zip: ['', [Validators.required]],
    });

    // calling multiple method
    forkJoin([this.get_countries(), this.get_states(), this.getCurrentUser()]);
  }

  // save user data
  onSubmit(customerData) {
    this.userForm.controls['address2'].setErrors(null);

    this.markFormGroupDirtied(this.userForm);
    if (this.userForm.valid) {
      customerData['CID'] = this.CID;
      customerData['country'] = 'US';
      customerData['id'] = this.userData.id;
      // call service for edit user
      this.UserService.editUserProfile(customerData).subscribe((res) => {
        // show message
        this.translate.get('USER_PROFILE_UPDATED_SUCCESSFULLY').subscribe((res: string) => {
          this.toastr.success(res);
        });

        // reset from 
        this.userForm.reset();

        // rest set user data in localstorag
        localStorage.setItem('user', JSON.stringify(res.data));
        // set user data using service
        this.UserService.setUserDataList();

        // redirect
        this.changeRouter('account/profile');

      },
        (error: any) => {
          if (error.error.error) {
            this.toastr.error(error.error.error);
          }
        });
    } else {
      console.log(this.userForm);
    }
  }
  // check validation for whole form 
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

  // get countries list from db
  get_countries() {
    this.CountriesService.getCountries().subscribe((res: any) => {
      if (!res.error) {
        this.CountriesList = res.data;
      }
    }, (error) => {
    });
  }

  // get states list from db
  get_states() {
    this.CountriesService.getStates().subscribe((res: any) => {
      if (!res.error) {
        this.statesList = res.data;
      }
    }, (error) => {
    });
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
          this.userForm.patchValue({
            first_name: this.currentUser[0].first_name,
            last_name: this.currentUser[0].last_name,
            email: this.currentUser[0].email,
            phone: this.currentUser[0].phone,
            address: this.currentUser[0].address,
            address2: this.currentUser[0].address2,
            city: this.currentUser[0].city,
            state: this.currentUser[0].state,
            zip: this.currentUser[0].zip
          });
        }
      }, (error) => {
      });
    }
  }

}

