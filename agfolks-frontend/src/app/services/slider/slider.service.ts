import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as qs from 'qs';
// Import environment config file.
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SliderService {

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
   * this service return will return slider.
   */
  getSystemPageSlider(cond): Observable<any> {
    return this.http.get<[]>(this.url + 'get_slider?' + qs.stringify(cond), this.httpOptions);
  }

}
