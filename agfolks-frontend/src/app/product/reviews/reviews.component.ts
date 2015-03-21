import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-reviews',
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.sass']
})
export class ReviewsComponent implements OnInit {
  reQuesTab : string;
  
  constructor() { 
  this.reQuesTab = 'reviews';
  }

  ngOnInit() {
  }

}
