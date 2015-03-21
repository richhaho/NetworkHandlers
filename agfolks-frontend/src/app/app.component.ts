import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Spinkit } from 'ng-http-loader';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  spinkit = Spinkit;
  
  constructor(private translate: TranslateService) {
    // Set translate language
    translate.setDefaultLang('en');
  }
}
