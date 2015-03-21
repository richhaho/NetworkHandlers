import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { StoreService } from '../../../services/store/store.service';
// Import environment config file.
import { environment } from 'src/environments/environment';
import { UserService } from '../../../services/auth/user.service'
import { CountriesService } from '../../../services/countries/countries.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.sass']
})
export class CheckoutComponent implements OnInit {

  checkoutForm:any;
  CID: Number = environment.config.CID;
  PORTAL_URL: string = environment.config.PORTAL_URL;
  cartProductList: any;
  productCount: Number;
  subTotal: Number;
  UserToken: string;
  userData: any;
  statesList: any;
  checkout: any;
  ShowShipping: boolean;
  addressList: any;
  SessionID:any;
  
  
  constructor(private router: Router,
    private StoreService: StoreService,
    private toastr: ToastrService,
    private translate: TranslateService,
    private UserService: UserService,
    private CountriesService: CountriesService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute) {

    // Set translate language
    translate.setDefaultLang('en');  
  }

  ngOnInit() {
  
  
    this.userData = false;
    this.SessionID = localStorage.getItem('SessionID')
    // brodcast data for login user
    this.userData = '';
    this.UserService.setUserDataList();
    this.UserService.castUserData.subscribe(userData => {
      this.userData = userData;
      if (!(this.userData)){
        let slug = "login?redirect=checkout";
        this.changeRouter(slug);
      }else{
        // calling get product info method
        this.getProductCartList();

        // start form
        this.checkoutForm = this.formBuilder.group({
          new_address: [''],
          ShipToDiffAddress: [''],
          billing_companyname: [''],
          billing_first_name: ['', Validators.required],
          billing_last_name: ['', Validators.required],
          billing_email: ['', Validators.required],
          billing_phone: ['', Validators.required],
          billing_address1: ['', Validators.required],
          billing_address2: [''],
          billing_city: ['', Validators.required],
          billing_zip: ['', Validators.required],
          billing_state: ['', Validators.required],
          shipping_first_name: ['', Validators.required],
          shipping_last_name: ['', Validators.required],
          shipping_email: ['', Validators.required],
          shipping_phone: ['', Validators.required],
          shipping_address1: ['', Validators.required],
          shipping_address2: [''],
          shipping_city: ['', Validators.required],
          shipping_zip: ['', Validators.required],
          shipping_state: ['', Validators.required],
          type: [''],
          Pickup: [''],
          LoadingDock: [''],
          EqpUpload: [''],
          LiftGate: [''],
          CallAhead: [''],
          SemiTrucks: ['']
        });
        
        let checkout_data: any = localStorage.getItem('checkout_data_'+this.SessionID);
        if (checkout_data) {
            checkout_data = JSON.parse(checkout_data);
            this.ShowShipping = (checkout_data) ? checkout_data.ShipToDiffAddress : false;
            
            this.checkoutForm.patchValue({
              new_address: 'existing',
              ShipToDiffAddress: (checkout_data) ? checkout_data.ShipToDiffAddress : '',
              CallAhead: (checkout_data) ? checkout_data.CallAhead : '',
              EqpUpload: (checkout_data) ? checkout_data.EqpUpload : '',
              SemiTrucks: (checkout_data) ? checkout_data.SemiTrucks : '',
              LiftGate: (checkout_data) ? checkout_data.LiftGate : '',
              LoadingDock: (checkout_data) ? checkout_data.LoadingDock : '',
              Pickup: (checkout_data) ? checkout_data.Pickup : '',
              type: (checkout_data) ? checkout_data.type : '',
              billing_first_name: (checkout_data) ? checkout_data.billing_first_name : '',
              billing_last_name: (checkout_data) ? checkout_data.billing_last_name : '',
              billing_email: (checkout_data) ? checkout_data.billing_email : '',
              billing_phone: (checkout_data) ? checkout_data.billing_phone : '',
              billing_address1: (checkout_data) ? checkout_data.billing_address1 : '',
              billing_address2: (checkout_data) ? checkout_data.billing_address2 : '',
              billing_city: (checkout_data) ? checkout_data.billing_city : '',
              billing_state: (checkout_data) ? checkout_data.billing_state : '',
              billing_zip: (checkout_data) ? checkout_data.billing_zip : '',
              shipping_first_name: (checkout_data) ? checkout_data.shipping_first_name : '',
              shipping_last_name: (checkout_data) ? checkout_data.shipping_last_name : '',
              shipping_email: (checkout_data) ? checkout_data.shipping_email : '',
              shipping_phone: (checkout_data) ? checkout_data.shipping_phone : '',
              shipping_address1: (checkout_data) ? checkout_data.shipping_address1 : '',
              shipping_address2: (checkout_data) ? checkout_data.shipping_address2 : '',
              shipping_city: (checkout_data) ? checkout_data.shipping_city : '',
              shipping_state: (checkout_data) ? checkout_data.shipping_state : '',
              shipping_zip: (checkout_data) ? checkout_data.shipping_zip : '',
            });
        
        }else{
        
            this.checkoutForm.patchValue({
              new_address: 'existing',
              billing_first_name: (this.userData) ? this.userData.first_name : '',
              billing_last_name: (this.userData) ? this.userData.last_name : '',
              billing_email: (this.userData) ? this.userData.email : '',
              billing_phone: (this.userData) ? this.userData.phone : '',
              billing_address1: (this.userData) ? this.userData.address : '',
              billing_address2: (this.userData) ? this.userData.address2 : '',
              billing_city: (this.userData) ? this.userData.city : '',
              billing_state: (this.userData) ? this.userData.state : '',
              billing_zip: (this.userData) ? this.userData.zip : '',
              shipping_first_name: (this.userData) ? this.userData.first_name : '',
              shipping_last_name: (this.userData) ? this.userData.last_name : '',
              shipping_email: (this.userData) ? this.userData.email : '',
              shipping_phone: (this.userData) ? this.userData.phone : '',
              shipping_address1: (this.userData) ? this.userData.address : '',
              shipping_address2: (this.userData) ? this.userData.address2 : '',
              shipping_city: (this.userData) ? this.userData.city : '',
              shipping_state: (this.userData) ? this.userData.state : '',
              shipping_zip: (this.userData) ? this.userData.zip : '',
            });
        }
        

        

      }

      // get user token
      this.UserToken = localStorage.getItem('token');

    });
    
    // This service subscribe states list
    this.get_states();
    
    // This service will fetch user address
    this.get_user_address();
    
    
  }

    // redirect to page according to url
    changeRouter(slug): void {
        this.router.routeReuseStrategy.shouldReuseRoute = () => false;
        this.router.navigateByUrl(slug, { replaceUrl: true });
    }
  
    onSubmit(formData) {
    
        this.checkoutForm.controls['billing_address2'].setErrors(null);
        this.checkoutForm.controls['shipping_address2'].setErrors(null);
        this.checkoutForm.controls['billing_companyname'].setErrors(null);
        
        this.markFormGroupDirtied(this.checkoutForm);
        if (this.checkoutForm.valid) {
          formData['CID'] =  this.CID;
          formData['CustomerID'] =  this.userData.id;
          formData['billing_country'] =  'US';
          formData['shipping_country'] =  'US';
          this.StoreService.ReviewOrder(formData)
          .subscribe(
              (res) => {
                // set data in localstorage
                localStorage.setItem('checkout_data_'+this.SessionID, JSON.stringify(formData));

                this.router.navigateByUrl('payment');
                //this.checkoutForm.reset();
                this.translate.get('ADDRESS_SAVED_SUCCESS').subscribe((res: string) => {
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
      
      
    // Get store list
    get_user_address(): void {
    
        let dataObj = {
            cid: this.CID,
            userId: this.userData.id
        }
        this.UserService.getCurrentUserAddress(dataObj).subscribe(res => {
            if (res && res.data && res.data.length) {
              this.addressList = res.data;
            }
        }, (error) => {
          this.addressList = [];
        });

    }
    
    // get states list from db
    get_states() {
        this.CountriesService.getStates().subscribe((res:any) => {
            if (!res.error) {
                this.statesList = res.data;
            } else {

            }
        }, (error) => {

        });
    }
    
    
    // Choose Shipping Address
    DeliverToAddress(address) {
        
        this.checkoutForm.patchValue({
            new_address: 'existing',
            shipping_first_name: address.First_Name,
            shipping_last_name: address.Last_Name,
            shipping_email: address.Email_Address,
            shipping_phone: address.Phone_Number,
            shipping_address1: address.Address,
            shipping_address2: address.Address2,
            shipping_city: address.City,
            shipping_state: address.State,
            shipping_zip: address.ZipCode
        });
      
    }
    
    // Add New Address
    AddNewAddress() {
        
        this.checkoutForm.patchValue({
            new_address: 'new',
            shipping_first_name: '',
            shipping_last_name: '',
            shipping_email: '',
            shipping_phone: '',
            shipping_address1: '',
            shipping_address2: '',
            shipping_city: '',
            shipping_state: '',
            shipping_zip: '',
        });
      
    }
    
    // Ship to different address 
    ShipToDiffAddress(event) {
        if(event.target.checked){
            this.ShowShipping = true;
        }else{
            this.ShowShipping = false;
        }
      
    }

    SameAsBillingAddress(){
      this.checkoutForm.patchValue({
        shipping_first_name: this.checkoutForm.controls.billing_first_name.value,
        shipping_last_name: this.checkoutForm.controls.billing_last_name.value,
        shipping_email: this.checkoutForm.controls.billing_email.value,
        shipping_phone: this.checkoutForm.controls.billing_phone.value,
        shipping_address1: this.checkoutForm.controls.billing_address1.value,
        shipping_address2: this.checkoutForm.controls.billing_address2.value,
        shipping_city: this.checkoutForm.controls.billing_city.value,
        shipping_state: this.checkoutForm.controls.billing_state.value,
        shipping_zip: this.checkoutForm.controls.billing_zip.value,
      });

    }
    
    
  // Get cart info 
  getProductCartList(): void {
    let checkItem: any = localStorage.getItem('SessionID');
    
    if (checkItem && this.userData) {
      let dataObj = {
        cid: this.CID,
        SessionID: checkItem,
        userData: this.userData
      };
      
      // calling cart sales and shipping
      this.StoreService.getProductCartInfo(dataObj).subscribe(res1 => {
        
        if (res1 && res1.data && res1.data.length) {
          // set data 
          this.productCount = res1.productCount;
          this.cartProductList = res1.data;
          this.subTotal = res1.subTotal;
          
        }else{
          this.changeRouter('store');
        }
      }, (error) => {
        this.changeRouter('store');
      });
    }else{
      this.changeRouter('store');
    }
  }

}
