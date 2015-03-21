import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as qs from 'qs';
// Import environment config file.
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HomeService {

  // Define the class property.
  private url: string = environment.config.API_URL
  private apikey: string = environment.config.APIKEY
  private httpOptions: any;

  constructor(private http: HttpClient) {
    this.httpOptions = {
      headers: new HttpHeaders({
        apikey: this.apikey
      })
    };
  }

  /**
   * this service return categories list according to CID.
   */
  getCmsPage(cond): Observable<any> {
    return this.http.get<[]>(this.url + 'get_cms_page_content?' + qs.stringify(cond), this.httpOptions);
  }

  /**
   * this service return menu list according to CID.
   */
  getMenu(cond): Observable<any> {
    return this.http.get<[]>(this.url + 'get_menu?' + qs.stringify(cond), this.httpOptions);
  }

  /**
   * this service return menu list according to CID.
   */
  getFooterMenu(cond): Observable<any> {
    return this.http.get<[]>(this.url + 'get_footer?' + qs.stringify(cond), this.httpOptions);
  }
}
