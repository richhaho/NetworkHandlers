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
export class CountriesService {
  // Define the class property.
  private url: string = environment.config.API_URL
  private apikey: string = environment.config.APIKEY
  private httpOptions: any;
  private CountriesList: any = new BehaviorSubject<[]>([]);
  castCountry = this.CountriesList.asObservable();

  constructor(private http: HttpClient) {
    this.httpOptions = {
      headers: new HttpHeaders({
        apikey: this.apikey
      })
    };
  }

  /**
   * this service return all countries
   */
  getCountries(): Observable<any> {
    return this.http.get<[]>(this.url + 'get_countries?', this.httpOptions);
  }
  
  getStates(): Observable<any> {
    return this.http.get<[]>(this.url + 'get_states?', this.httpOptions);
  }
}
