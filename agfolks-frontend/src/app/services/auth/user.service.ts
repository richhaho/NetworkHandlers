import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as qs from 'qs';
import { Router } from '@angular/router';

// Import environment config file.
import { environment } from 'src/environments/environment';
import {IUser, IManufacturer, IForgotPassword, IResetPassword,IWishList} from '../../client-schema';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    // Define the class property.
    private url: string = environment.config.API_URL;
    private apikey: string = environment.config.APIKEY;
    private CID: Number = environment.config.CID;
    private httpOptions: any;
    private userData: any = new BehaviorSubject<[]>([]);
    castUserData = this.userData.asObservable();

    constructor(private http: HttpClient, private router: Router) {
        this.httpOptions = {
            headers: new HttpHeaders({
                apikey: this.apikey
            })
        };
    }
    /**
      * this service set user data for broadcasting.
      */
    setUserDataList() {
        this.userData.next(JSON.parse(localStorage.getItem('user')));
    }
    /**
     * this service set user data for broadcasting.
     */
    signOut() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.setUserDataList();
        this.router.routeReuseStrategy.shouldReuseRoute = () => false;
        this.router.navigateByUrl('', { replaceUrl: true });
    }
    /**
     * Register User
     */
    registerUser(userData: IUser): Observable<any> {
        return this.http.post<[]>(this.url + 'sign_up', userData, this.httpOptions);
    }
    /**
     * Login User
     */
    loginUser(userData: IUser): Observable<any> {
        return this.http.post<[]>(this.url + 'login', userData, this.httpOptions);
    }
    /*** Register Manufacturer ***/
    registerManufacturer(data: any): Observable<any> {
        return this.http.post<[IManufacturer]>(this.url + 'manufacturer_sign_up', data, this.httpOptions);
    }
    /**
      * this service will return user address.
    */
    getUserAddress(cond): Observable<any> {
        return this.http.get<[]>(this.url + 'get_user_address?' + qs.stringify(cond), this.httpOptions);
    }

    forgotPassword(data: IForgotPassword): Observable<any> {
        return this.http.post<[]>(this.url + 'forgot_pass', data, this.httpOptions);
    }

    resetPassword(data: IResetPassword): Observable<any> {
        return this.http.post<[]>(this.url + 'reset_pass', data, this.httpOptions);
    }
    
    getCurrentUserAddress(cond): Observable<any> {
        return this.http.get<[]>(this.url + 'get_current_user_address?' + qs.stringify(cond), this.httpOptions);
    }
    // check authentication 
    public isAuthenticated(): boolean {
        const item = localStorage.getItem('token');
        if (typeof item === 'undefined' || item === null) return false; 
        return true;
    }

    // get current user info
    getCurrentUser(cond): Observable<any> {
        return this.http.get<[]>(this.url + 'get_current_user?' + qs.stringify(cond), this.httpOptions);
    }

    /*** update user information ***/
    editUserProfile(data: IUser): Observable<any> {
        return this.http.post<[]>(this.url + 'edit_user_profile', data, this.httpOptions);
    }

    /*** update user address ***/
    editAddress(data: IUser): Observable<any> {
        return this.http.post<[]>(this.url + 'edit_address', data, this.httpOptions);
    }


    // remove user address
    removeAddress(cond): Observable<any> {
        return this.http.get<[]>(this.url + 'remove_address?' + qs.stringify(cond), this.httpOptions);
    }

    /**
     * password updated service
     */
    updatePassword(userData: IUser): Observable<any> {
        return this.http.post<[]>(this.url + 'update_password', userData, this.httpOptions);
    }
    
    // get current user orders
    getUserOrders(cond): Observable<any> {
        return this.http.get<[]>(this.url + 'get_user_orders?' + qs.stringify(cond), this.httpOptions);
    }
    
    // get order details 
    getOrderDetails(cond): Observable<any> {
        return this.http.get<[]>(this.url + 'get_order_details?' + qs.stringify(cond), this.httpOptions);
    }
    
    // get current user orders
    addToWishlist(Data: IWishList): Observable<any> {
        return this.http.post<[]>(this.url + 'add_to_wishlist', Data, this.httpOptions);
    }
    
    // get order details 
    getWishlist_Products(cond): Observable<any> {
        return this.http.get<[]>(this.url + 'get_user_wishlist_products?' + qs.stringify(cond), this.httpOptions);
    }
    
    // get order details 
    removeProductFromWishlist(cond): Observable<any> {
        return this.http.get<[]>(this.url + 'remove_product_from_wishlist?' + qs.stringify(cond), this.httpOptions);
    }
    
}
