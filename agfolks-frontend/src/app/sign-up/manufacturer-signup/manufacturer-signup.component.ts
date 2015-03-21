import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MustMatch } from '../_helpers/must-match.validator';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

/*
 * Import the service
 */
import { UserService } from '../../services/auth/user.service';
import { CountriesService } from '../../services/countries/countries.service';

@Component({
  selector: 'app-manufacturer-signup',
  templateUrl: './manufacturer-signup.component.html',
  styleUrls: ['./manufacturer-signup.component.sass']
})
export class ManufacturerSignupComponent implements OnInit {

  userForm;
  url: string = environment.config.API_URL;
  private CID: Number = environment.config.CID;
  private PORTAL_URL: string = environment.config.PORTAL_URL;
  private MANUFACTURER_GROUP_ID: Number = environment.config.MANUFACTURER_GROUP_ID;
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
  ) { }

  ngOnInit() {
  
    // This service subscribe countries list
    this.get_countries();

    // This service subscribe states list
    this.get_states();
    
    this.userForm = this.formBuilder.group({
      Company_Name: ['', Validators.required],
      First_Name: ['', Validators.required],
      Last_Name: ['', Validators.required],
      Email_Address: ['', [Validators.required, Validators.email]],
      Mobile_Phone: ['', [Validators.required]],
      Address: ['', Validators.required],
      Address2: [''],
      State: ['', [Validators.required]],
      City: ['', [Validators.required]],
      ZIP: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmpass: ['', [Validators.required]],
      notifyme: [''],
      acceptpolicy: ['', [Validators.required]]
    }, {
        validator: MustMatch('password', 'confirmpass')
      });
  }
  onSubmit(formData) {
    // remove validation for address2
    this.userForm.controls['Address2'].setErrors(null);
    this.markFormGroupDirtied(this.userForm);
    if (this.userForm.valid) {
      formData['CID'] =  this.CID;
      formData['MANUFACTURER_GROUP_ID'] =  this.MANUFACTURER_GROUP_ID;
      formData['Country'] =  'US';
      this.userService.registerManufacturer(formData)
        .subscribe(
              (res) => {
                this.changeRouter('thank-you');
                this.userForm.reset();
                // Display message 
                this.translate.get('SIGNUP_SUCCESSS_MSG').subscribe((res: string) => {
                  this.toastr.success(res);
                });
              },
              (error: any) => {
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
