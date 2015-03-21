import { Component, OnInit } from '@angular/core';

// Handle the global property
import { Globals } from '../../common/globals';

@Component({
  selector: 'app-attachments-accessories',
  templateUrl: './attachments-accessories.component.html',
  styleUrls: ['./attachments-accessories.component.sass']
})
export class AttachmentsAccessoriesComponent implements OnInit {
  attachmentASOptions: any = {};
  attachmentASStore: any = [];
  constructor(private globals: Globals, ) { }

  ngOnInit() {
    // Call method
    this.attachmentASlider();
  }

  /**
   * Define method for slider
   */
  attachmentASlider(): void {
    // Copy objects
    this.attachmentASOptions = Object.assign({}, this.globals.attachmentASOptions);
    this.attachmentASStore = [{
      id: 1,
      src: './assets/images/accessories/Farm-Tractor_450.png',
      title: 'Farm Tractor'
    },
      {
        id: 2,
        src: './assets/images/accessories/Wheel-Loader_450.png',
        title: 'Wheel Loader'
      },
      {
        id: 3,
        src: './assets/images/accessories/Utility-Tractor_450.png',
        title: 'Utility Tractor'
      },
      {
        id: 4,
        src: './assets/images/accessories/Compact-Tractor_450.png',
        title: 'Compact Tractor'
      },
      {
        id: 5,
        src: './assets/images/accessories/Telehandler_450.png',
        title: 'Telehandler'
      },
      {
        id: 6,
        src: './assets/images/accessories/Skid-Steer_450.png',
        title: 'Skid Steer'
      },
      {
        id: 7,
        src: './assets/images/accessories/Excavator_450.png',
        title: 'Excavator'
      },
      {
        id: 8,
        src: './assets/images/accessories/Atv_450.png',
        title: 'ATV'
      },
      {
        id: 9,
        src: './assets/images/accessories/Utv_450.png',
        title: 'UTV'
      },
    ]
  }

}
