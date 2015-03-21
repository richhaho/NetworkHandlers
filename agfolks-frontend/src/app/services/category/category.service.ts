import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as qs from 'qs';

// Import environment config file.
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  // Define the class property.
  private url: string = environment.config.API_URL
  private apikey: string = environment.config.APIKEY
  private httpOptions: any;
  private categoryList: any = new BehaviorSubject<[]>([]);
  castCategory = this.categoryList.asObservable();

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
  setCategoryList(categoryList) {
    this.categoryList.next(categoryList);
  }
  /**
   * this service return categories list according to CID.
   */
  getCategories(cond): Observable<any> {
    return this.http.get<[]>(this.url + 'get_categories?' + qs.stringify(cond), this.httpOptions);
  }
  
  // get featured categories 
  getFeaturedCategories(cond): Observable<any> {
    return this.http.get<[]>(this.url + 'get_featured_categories?' + qs.stringify(cond), this.httpOptions);
  }
}
