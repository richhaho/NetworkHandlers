import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class Globals {
  developmentKey = true;
  // Define main slider options.
  mainSliderOptions: any = {
    autoplay: true,
    loop: true,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: true,
    dots: false,
    navSpeed: 700,
    navText: ['', ''],
    responsive: {
      0: {
        items: 1
      },
      400: {
        items: 1
      },
      740: {
        items: 1
      },
      940: {
        items: 1
      }
    },
    nav: true
  };
  
  // Define main attachments and accessories slider options.
  attachmentASOptions: any = {
    autoplay: false,
    loop: true,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: true,
    dots: false,
    navSpeed: 700,
    navText: ['', ''],
    responsive: {
      0: {
        items: 2
      },
      400: {
        items: 3
      },
      740: {
        items: 4
      },
      940: {
        items: 6
      }
    },
    nav: true
  };
  
  // Define slimscroll attributes
  slimSOptions = {
    position: "right", // left | right
    barBackground: "black", // #C9C9C9
    barOpacity: "0.8", // 0.8
    barWidth: "3", // 10
    barBorderRadius: "20", // 20
    barMargin: "0", // 0
    gridBackground: "#d9d9d9", // #D9D9D9
    gridOpacity: "1", // 1
    gridWidth: "2", // 2
    gridBorderRadius: "20", // 20
    gridMargin: "0", // 0
    alwaysVisible: true, // true
    visibleTimeout: 1000, // 1000
  };
}
