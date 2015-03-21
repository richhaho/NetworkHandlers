import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as qs from 'qs';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { environment } from 'src/environments/environment';
// Import store type interface.
import { IStore } from '../../client-schema';
import { IUserAddress } from '../../client-schema';
import { IStorePayment } from '../../client-schema';


@Injectable({
  providedIn: 'root'
})
export class StoreService {
  // Define the class property.
  private url: string = environment.config.API_URL
  private apikey: string = environment.config.APIKEY
  private httpOptions: any;
  private cartProductList: any = new BehaviorSubject<[]>([]);
  castCartProductList = this.cartProductList.asObservable();

  constructor(private http: HttpClient) {
    this.httpOptions = {
      headers: new HttpHeaders({
        apikey: this.apikey
      })
    };
  }

  /**
     * this service set category list for broadcasting.
     */
  setCartProductList(item) {
    this.cartProductList.next(item);
  }
  /**
   * this service return store list CID.
   */
  getStorelist(cond): Observable<any> {
    return this.http.get<[]>(this.url + 'get_store_list?' + qs.stringify(cond), this.httpOptions);
  }

  /**
  * this service return product list CID.
  */
  getProductsList(cond): Observable<any> {
    return this.http.get<[]>(this.url + 'get_products_list?' + qs.stringify(cond), this.httpOptions);
  }

  /**
  * this service return product details.
  */
  getProductDetails(cond): Observable<any> {
    return this.http.get<[]>(this.url + 'get_product_details?' + qs.stringify(cond), this.httpOptions);
  }

  /**
   * temporary add product in table
   */
  tmpAddToProduct(data: IStore): Observable<any> {
    return this.http.post<[IStore]>(this.url + 'tmp_add_to_product', data, this.httpOptions);
  }

  /**
  * this service return cart info.
  */
  getProductCartInfo(cond): Observable<any> {
    return this.http.get<[]>(this.url + 'get_product_cart_info?' + qs.stringify(cond), this.httpOptions);
  }

  /**
  * this service remove cart item.
  */
  removeCartItem(cond): Observable<any> {
    return this.http.get<[]>(this.url + 'remove_cart_item?' + qs.stringify(cond), this.httpOptions);
  }

  /**
  * this service return cart info.
  */
  getCartSalesAndShipping(cond): Observable<any> {
    return this.http.post<[]>(this.url + 'get_cart_sales_shipping', cond, this.httpOptions);
  }
  
  /**
   * Save user address
   */
  SaveUserAddress(data: IUserAddress): Observable<any> {
    return this.http.post<[IUserAddress]>(this.url + 'save_user_address', data, this.httpOptions);
  }
  
  /**
   * make payment api
   */
  ReviewOrder(data: any): Observable<any> {
    return this.http.post<[IStorePayment]>(this.url + 'review_order', data, this.httpOptions);
  }
  
  /**
   * make payment api
   */
  MakePayment(data: any): Observable<any> {
    return this.http.post<[IStorePayment]>(this.url + 'make_payment', data, this.httpOptions);
  }

  /**
   * temporary add product in table
  */
  updateMemberId(data: object): Observable < any > {
    return this.http.post<[]>(this.url + 'update_add_to_product', data, this.httpOptions);
  }
  
  // update cart function
  updateCart(data: object): Observable < any > {
    return this.http.post<[]>(this.url + 'update_cart', data, this.httpOptions);
  }
  
  // update cart function
  ApplyCoupon(data: object): Observable < any > {
    return this.http.post<[]>(this.url + 'apply_coupon', data, this.httpOptions);
  }
  
  // update cart function
  RemoveCoupon(data: object): Observable < any > {
    return this.http.post<[]>(this.url + 'remove_coupon', data, this.httpOptions);
  }

  searchProducts(cond): Observable<any> {
    return this.http.get<[]>(this.url + 'search_products?' + qs.stringify(cond), this.httpOptions);
  }

  getStoreAttributes(cond): Observable<any> {
    return this.http.get<[]>(this.url + 'get_store_attributes?' + qs.stringify(cond), this.httpOptions);
  }

}
