import { Component, OnInit, Input} from '@angular/core';

// Handle the global property
import { Globals } from '../../common/globals';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.sass']
})
export class SliderComponent implements OnInit {
  mainSliderOptions: any = {};
  CID: number = environment.config.CID;
  PORTAL_URL: string = environment.config.PORTAL_URL;
  slidesStore: any = [];
  @Input() sliderData;
  constructor(private globals: Globals,) { }

  ngOnInit() {
    // Call slider method
    this.mainSlider();
  }

  /**
   * Define method for slider
   */
  mainSlider(): void {
    // Copy objects
    this.mainSliderOptions = Object.assign({}, this.globals.mainSliderOptions);
    this.slidesStore = this.sliderData;
  }

}
