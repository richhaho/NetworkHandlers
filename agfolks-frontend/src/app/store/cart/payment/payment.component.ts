import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { StoreService } from '../../../services/store/store.service';
// Import environment config file.
import { environment } from 'src/environments/environment';
import { UserService } from '../../../services/auth/user.service'
import { CountriesService } from '../../../services/countries/countries.service';
import * as _ from "lodash";
import { forkJoin } from 'rxjs';

declare var stripe: any;
declare var elements: any;

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.sass']
})
export class PaymentComponent implements OnInit {

  @ViewChild('cardInfo') cardInfo: ElementRef;
  card: any;
  cardHandler = this.onChange.bind(this);
  error: string;

  paymentForm: any;
  formData: any;
  CID: Number = environment.config.CID;
  PORTAL_URL: string = environment.config.PORTAL_URL;
  cartProductList: any;
  productCount: Number;
  subTotal: any;
  subTotal2: any;
  UserToken: string;
  userData: any;
  CountriesList: any;
  statesList: any;
  payment: any;
  checkout_data: any;
  BillingAddress: any;
  ShippingAddress: any;
  salesTax: Number;
  totalOrderAmount: any;
  totalOrderAmount2: any;
  shippingData : any;
  shippingTotal: Number;
  notifyValue : string;
  notesValue : string;
  statusNotifyValue: boolean;
  orderNumber: string;
  TotalDiscount:any;
  HaveCouponCode:boolean;
  CouponCode: string;
  CouponCodeApplied: boolean;
  CouponDiscount: any;
  CouponCodeData: any;
  CouponApply_on: any;
  CouponDiscountPerProduct:any;

  constructor(private router: Router,
    private StoreService: StoreService,
    private toastr: ToastrService,
    private translate: TranslateService,
    private UserService: UserService,
    private CountriesService: CountriesService,
    private formBuilder: FormBuilder,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute,
    private location: Location) {

    // Set translate language
    translate.setDefaultLang('en');
    // set empty value
    this.notifyValue ='';
    this. notesValue ='';
    this.CouponCode = '';
    this.CouponDiscount = 0;
    this.CouponCodeData = '';
    this.CouponApply_on = 0;
    this.CouponDiscountPerProduct = 0;
    this.TotalDiscount = 0;
  }

  ngOnInit() {
    // brodcast data for login user
    this.userData = '';
    this.UserService.setUserDataList();
    this.UserService.castUserData.subscribe(userData => {
      this.userData = userData;
      if (!(this.userData)) {
        let slug = "login?keyParms=payment";
        this.changeRouter(slug);
      } else {
        // calling get product info method
        this.getCartSalesAndShipping();
        
      }
      // get user token
      this.UserToken = localStorage.getItem('token');
    });


    this.paymentForm = this.formBuilder.group({
      cc_name: ['', Validators.required],
      cc_number: ['', Validators.required],
      cc_month: ['', Validators.required],
      cc_year: ['', Validators.required],
      cc_cvc: ['', Validators.required]
    });

    this.HaveCouponCode = false;
    this.CouponCodeApplied = false;

  }

  // redirect to page according to url
  changeRouter(slug): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.navigateByUrl(slug, { replaceUrl: true });
  }

  ngAfterViewInit() {
    this.card = elements.create('card');
    this.card.mount(this.cardInfo.nativeElement);
    this.card.addEventListener('change', this.cardHandler);
  }

  ngOnDestroy() {
    this.card.removeEventListener('change', this.cardHandler);
    this.card.destroy();
  }

  onChange({ error }) {
    if (error) {
      this.error = error.message;
    } else {
      this.error = null;
    }
    this.cd.detectChanges();
  }

  // apply coupon code
  ApplyCoupon():void{
    
    console.log(this.CouponCode);
    

    let SessionID: any = localStorage.getItem('SessionID');
    if (SessionID) {
      let dataObj = {
        CID: this.CID,
        SessionID: SessionID,
        CouponCode:this.CouponCode,
        cartProductList:this.cartProductList,
        subTotal:this.subTotal
      }
      this.StoreService.ApplyCoupon(dataObj).subscribe(res1 => {
        if (res1 && res1.data) {
          this.CouponDiscount = res1.data[0].Discount_Price;
          this.subTotal = this.subTotal-this.CouponDiscount;
          this.totalOrderAmount = this.totalOrderAmount-this.CouponDiscount;
          this.CouponCodeData = res1.data[0].COData;
          this.CouponApply_on = res1.data[0].Apply_on_products;
          this.CouponDiscountPerProduct = res1.data[0].CouponDiscountPerProduct;
          // Display message 
          this.translate.get('COUPON_APPLIED_SUCCESSFULLY').subscribe((res: string) => {
            this.toastr.success(res);
          });
          this.CouponCodeApplied = true;
        }else{
          this.translate.get('INVALID_COUPON_CODE').subscribe((res: string) => {
            this.toastr.error(res);
          });
        }
      }, (error) => {
        // Reset value for service
        if(error.error.error){
          this.toastr.error(error.error.error);
        }
      });
    }

  }

  // apply coupon code
  RemoveCoupon():void{
    
    if(this.CouponCodeApplied){
        this.subTotal = this.subTotal2;
        this.totalOrderAmount = this.totalOrderAmount2;
        this.CouponCodeApplied = false;
        this.CouponCode = '';
    }
  }

  // make payment now to complete the order
  MakePayment(token?: any) {
    let SessionID: any = localStorage.getItem('SessionID');
    if (SessionID && this.userData) {
      let cond = {
        CID: this.CID,
        CustomerID: this.userData.id,
        cardToken: token ? token.id : "",
        Currency: 'USD',
        CustomerData: this.userData,
        CheckoutData: this.checkout_data,
        productCount: this.productCount,
        cartProductList: this.cartProductList,
        subTotal: this.subTotal,
        totalOrderAmount: this.totalOrderAmount,
        OrderID:this.orderNumber,
        salesTax: this.salesTax,
        Payment_Discount:this.TotalDiscount,
        CouponCodeApplied:this.CouponCodeApplied,
        CouponCode: this.CouponCode,
        CouponDiscount: this.CouponDiscount,
        CouponCodeData: this.CouponCodeData,
        CouponApply_on:this.CouponApply_on,
        CouponDiscountPerProduct:this.CouponDiscountPerProduct,
        Shipping_Method: 'UPS',
        IP_ADDRESS: '157.37.162.10',
        ShippingDiscount: this.shippingData.discount,
        ShippingSubTotal: this.shippingData.subAmount,
        ShippingTotal: this.shippingData.total,
        notifyValue: this.notifyValue,
        Extra_Info: this.notesValue
      };

      // calling service
      this.StoreService.MakePayment(cond)
        .subscribe(
          (res) => {
            // rest added product in cart 
            this.StoreService.setCartProductList('');
            localStorage.removeItem('checkout_data_'+SessionID);
            
            this.paymentForm.reset();
            this.translate.get('ORDER_SUCCESS').subscribe((res: string) => {
              this.toastr.success(res);
            });
            
            
            if (this.orderNumber){
              let OrderID = this.orderNumber;
                //this.changeRouter('account/order-detail/'+OrderID+'?Order=Success');
              window.location.href = location.origin+'/account/order-detail/' + OrderID + '?Order=Success';
            }else{
                this.changeRouter('store');
            }
            
            
          },
          (error: any) => {
            if (error.error) {
              this.toastr.error(error.error.message);
            }
          }
        );
    } else {
      this.changeRouter('store');
    }
  }

  async getToken() {
    const { source, error } = await stripe.createSource(this.card);
    if (error) {
      this.toastr.error(error.message);
    } else {
      let status = true;
      this.statusNotifyValue = false;
      if (!this.notifyValue){
        status = false;
        this.statusNotifyValue = true;
      }
      
      if (status){
        this.MakePayment(source);
      }
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

  // Get cart info with sales/shipping
  getCartSalesAndShipping(): void {
    let SessionID: any = localStorage.getItem('SessionID');
    if (SessionID && this.userData) {
    
      let checkoutdata: any = localStorage.getItem('checkout_data_'+SessionID);
      if (checkoutdata) {
        this.checkout_data = JSON.parse(checkoutdata);
      }else{
        this.changeRouter('checkout');
      }

      let dataObj = {
        cid: this.CID,
        SessionID: SessionID,
        userData: this.userData,
        checkout_data:this.checkout_data
      };
      // calling cart sales and shipping
      this.StoreService.getCartSalesAndShipping(dataObj).subscribe(res1 => {
        if (res1 && res1.data && res1.data.length) {
          this.productCount = res1.productCount;
          this.cartProductList = res1.data;
          this.subTotal = res1.subTotal;
          this.subTotal2 = res1.subTotal;
          this.totalOrderAmount = res1.totalOrderAmount;
          this.totalOrderAmount2 = res1.totalOrderAmount;
          this.salesTax = res1.salesTax;
          this.shippingData = res1.shippingData;
          this.orderNumber = res1.orderNumber;
          
          let TotalDiscount_ = 0;
          if (this.cartProductList && this.cartProductList.length) {
            _.map(this.cartProductList, function (cartItem) {
                if(cartItem && cartItem.Discount_Price > 0){
                    let TotalDiscount__ = (cartItem.Product_Price * cartItem.Product_Count)-(cartItem.Discount_Price * cartItem.Product_Count);
                    TotalDiscount_ = TotalDiscount_+TotalDiscount__;
                }
            })
          }
          
          this.TotalDiscount = TotalDiscount_.toFixed(2);
          
          // This service will fetch user address
          this.get_user_address();
          
          //console.log(this.cartProductList);
        
        }else{
          this.changeRouter('store');
        }
      }, (error) => {
        this.changeRouter('store');
      });
    } else {
      this.changeRouter('store');
    }
  }

  // Get store list
  get_user_address(): void {
    let SessionID: any = localStorage.getItem('SessionID');
    let checkoutdata: any = localStorage.getItem('checkout_data_'+SessionID);
    if (checkoutdata) {
        this.checkout_data = JSON.parse(checkoutdata);
        
    }
  }
  getNotifymeValue(e): void{
    this.notifyValue = e.target.checked;
    this.statusNotifyValue = false; 
  }
  additionalNotes(value): void {
    this.notesValue = value;
  }

  getCouponValue(value){
    if(value != ''){
      this.CouponCode = value;
      this.HaveCouponCode = true;
    }else{
      this.HaveCouponCode = false;
    }

  }


}
