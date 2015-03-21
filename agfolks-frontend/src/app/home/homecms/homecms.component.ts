import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-homecms',
  templateUrl: './homecms.component.html',
  styleUrls: ['./homecms.component.sass']
})
export class HomecmsComponent implements OnInit {
  @Input() cmsPageData: any;
  constructor() { }

  ngOnInit() {
  }

}
