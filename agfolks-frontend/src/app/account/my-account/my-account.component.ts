import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-my-account',
  templateUrl: './my-account.component.html',
  styleUrls: ['./my-account.component.sass']
})
export class MyAccountComponent implements OnInit {

  constructor(
    private translate: TranslateService
  ) {
    // Set translate language
    translate.setDefaultLang('en');
   }

  ngOnInit() {
  }

}
