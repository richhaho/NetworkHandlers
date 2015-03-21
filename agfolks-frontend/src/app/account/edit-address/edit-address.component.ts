import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
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
  selector: 'app-edit-address',
  templateUrl: './edit-address.component.html',
  styleUrls: ['./edit-address.component.sass']
})
export class EditAddressComponent implements OnInit {


  userForm;
  url: string = environment.config.API_URL;
  private CID: Number = environment.config.CID;
  CountriesList: any;
  statesList: any;
  userData: any;
  currentAddress: any;
  UserToken: any;
  addressId: any;

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
      First_Name: ['', Validators.required],
      Last_Name: ['', Validators.required],
      Email_Address: ['', [Validators.required, Validators.email]],
      Phone_Number: ['', [Validators.required]],
      Address: ['', [Validators.required]],
      Address2: [''],
      State: ['', [Validators.required]],
      City: ['', [Validators.required]],
      ZipCode: ['', [Validators.required]],
    });

    this.route.paramMap.subscribe(params => {
      this.addressId = params.get("id");
      // calling multiple method
      forkJoin([this.get_countries(), this.get_states(), this.getCurrentUserAddress()]);
    });
  }

  // save user data
  onSubmit(customerData) {
    this.userForm.controls['Address2'].setErrors(null);

    this.markFormGroupDirtied(this.userForm);
    if (this.userForm.valid) {
      // check edit address id
      customerData['CID'] = this.CID;
      customerData['country'] = 'US';
      customerData['userId'] = this.userData.id;
      customerData['id'] = (this.addressId) ? this.addressId : '';
      // call service for update user address
      this.UserService.editAddress(customerData).subscribe((res) => {
        // show message
        if (this.addressId) {
          this.translate.get('ADDRESS_UPDATED_SUCCESSFULLY').subscribe((res: string) => {
            this.toastr.success(res);
          });
        } else {
          this.translate.get('ADDRESS_ADDED_SUCCESFULLY').subscribe((res: string) => {
            this.toastr.success(res);
          });
        }

        // reset from 
        this.userForm.reset();
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

  // get user address
  getCurrentUserAddress(): void {
    if (this.userData && this.userData.id && this.addressId) {
      let dataObj = {
        cid: this.CID,
        id: this.addressId,
        userId: this.userData.id
      }
      this.UserService.getCurrentUserAddress(dataObj).subscribe(res => {
        if (res && res.data && res.data.length) {
          this.currentAddress = res.data;
          this.userForm.patchValue({
            First_Name: this.currentAddress[0].First_Name,
            Last_Name: this.currentAddress[0].Last_Name,
            Email_Address: this.currentAddress[0].Email_Address,
            Phone_Number: this.currentAddress[0].Phone_Number,
            Address: this.currentAddress[0].Address,
            Address2: this.currentAddress[0].Address2,
            City: this.currentAddress[0].City,
            State: this.currentAddress[0].State,
            ZipCode: this.currentAddress[0].ZipCode
          });
        }
      }, (error) => {
      });
    }
  }

}
