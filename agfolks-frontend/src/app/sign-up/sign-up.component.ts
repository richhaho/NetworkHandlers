import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import { environment } from '../../environments/environment';
import { MustMatch } from './_helpers/must-match.validator';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { CountriesService } from '../services/countries/countries.service';

/*
 * Import the service
 */
import { UserService } from '../services/auth/user.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.sass']
})
export class SignUpComponent implements OnInit {
  userForm;
  url: string = environment.config.API_URL;
  private CID: Number = environment.config.CID;
  CountriesList: any;
  statesList: any;

  constructor(
      private userService: UserService,
      private CountriesService: CountriesService,
      private router: Router,
      private formBuilder: FormBuilder,
      private http: HttpClient,
      private toastr: ToastrService,
      private translate: TranslateService
      // private httpHeader: HttpHeaders
  ) {}

  ngOnInit() {

    // This service subscribe countries list
    this.get_countries();

    // This service subscribe states list
    this.get_states();

    this.userForm = this.formBuilder.group({
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address1: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      address2: [''],
      state: ['', [Validators.required]],
      city: ['', [Validators.required]],
      zip: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmpass: ['', [Validators.required]],
      notifyme: [''],
      acceptpolicy: ['', [Validators.required]]
    }, {
       validator: MustMatch('password', 'confirmpass')
    });
  }
  onSubmit(customerData) {
    this.userForm.controls['address2'].setErrors(null);

    this.markFormGroupDirtied(this.userForm);
    if (this.userForm.valid) {
      customerData['CID'] =  this.CID;
      customerData['country'] =  'US';
      this.userService.registerUser(customerData)
          .subscribe(
              (res) => {
                this.changeRouter('login');
                this.userForm.reset();
                this.translate.get('SIGNUP_SUCCESSS_MSG_MEMBER').subscribe((res: string) => {
                  this.toastr.success(res);
                });
              },
              (error: any) => {
                  console.log(error);
                  if (error.error.error) {
                    this.toastr.error(error.error.error);
                  }
              }
          );
    } else {
      console.log(this.userForm);
    }
  }
  private markFormGroupDirtied(formGroup: FormGroup) {
    (<any> Object).values(formGroup.controls).forEach(control => {
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
    this.CountriesService.getCountries().subscribe((res:any) => {
        if (!res.error) {
            console.log(res.data);
            this.CountriesList = res.data;
        } else {
            
        }
    }, (error) => {
        
    });
  }

  // get states list from db
  get_states() {
    this.CountriesService.getStates().subscribe((res:any) => {
        if (!res.error) {
            console.log(res.data);
            this.statesList = res.data;
        } else {
            
        }
    }, (error) => {
        
    });
  }

}
