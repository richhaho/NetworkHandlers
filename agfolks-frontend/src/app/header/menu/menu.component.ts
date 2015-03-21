import { Component, OnInit, HostListener, ViewChild,ElementRef } from '@angular/core';
import { forkJoin, from } from 'rxjs';
import { Router } from '@angular/router';
import { HomeService } from '../../services/home/home.service';
import { CategoryService } from '../../services/category/category.service';
import { UserService } from '../../services/auth/user.service'
// Import environment config file.
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.sass']
})
export class MenuComponent implements OnInit {
  CID: number = environment.config.CID;
  PORTAL_URL: string = environment.config.PORTAL_URL;
  menuList: any;
  categoryList: any;
  stickyNavMenu: boolean;
  classPFlag: boolean;
  private wasInside = false;
  rMenu: boolean;
  menuTab: string;
  UserName: string;
  UserID: string;
  UserToken: string;
  userData: any;
  
  // Getting stickly menu height 
  
  
  @ViewChild('pageMenu') menuElement: ElementRef;
  sticky: boolean = false;
  elementPosition: any;

  constructor(
    private HomeService: HomeService,
    private CategoryService: CategoryService,
    private router: Router,
    private UserService: UserService
  ) {
  }

  ngOnInit() {

    // brodcast data for login user
    this.UserService.setUserDataList();
    this.UserService.castUserData.subscribe(userData => {
      this.userData = userData;
      // get user token
      this.UserToken = localStorage.getItem('token');
    });
  
    // set menu tab value
    this.menuTab = 'Menu';

    // Calling menu and categoty method
    forkJoin([this.getMenuList(), this.getCategoryList()]);

    // This service subscribe category list
    this.CategoryService.castCategory.subscribe(categoryList => this.categoryList = categoryList);
  }
  
  
  ngAfterViewInit(){
    this.elementPosition = this.menuElement.nativeElement.offsetTop;
  }

  // Mange Sticky menu show/hide 
  @HostListener("window:scroll", ['$event'])
  stickyMenu() {
    const windowScroll = window.pageYOffset;
      if(windowScroll >= this.elementPosition){
        this.stickyNavMenu = true;
      } else {
        this.stickyNavMenu = false;
        this.classPFlag = false;
      }
  }

  // Manage class flag true/false;
  togglePMenu(): void {
    if (!this.classPFlag) {
      this.classPFlag = true;
      this.wasInside = true;
    }
  }

  // Manage host listener 
  @HostListener('document:click', ['$event'])
  clickout(): void {
    if (!this.wasInside) {
      this.classPFlag = false;
    }
    this.wasInside = false;
  }

  // Mobile responsive menu 
  mobileRMenu(): void {
    if (!this.rMenu) {
      this.rMenu = true;
      this.stickyNavMenu = false;
      this.classPFlag = false;
    } else {
      this.rMenu = false;
    }

  }
  // sign out
  signOut(): void {
    this.UserService.signOut();
  }

  // redirect to page according to url
  changeRouter(slug): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.navigateByUrl(slug, { replaceUrl: true });
  }

  // Fetch menus method
  getMenuList(): void {
    // Set conditions
    let cond = {
      cid: this.CID
    };
    this.HomeService.getMenu(cond)
      .subscribe(res => {
        if (res && res.data && res.data.length) {
          this.menuList = res.data // Set menu list
        }
      }, (err) => {

      });
  }

  //fetch categories method
  getCategoryList(): void {
    // Set conditions
    let cond = {
      cid: this.CID,
      parent_category_id: ''
    };
    this.CategoryService.getCategories(cond)
      .subscribe(res => {
        if (res && res.data && res.data.length) {
          // Set data for subscribe categorty list
          this.CategoryService.setCategoryList(res.data);
        }
      }, (err) => {

      });
  }

  // Print child down category 
  childCList: any;
  storeCategory = {};
  childCategory(itme, parentList): void {
    // Check zero index ids
    if (itme && itme[0] && itme[0].ID) {
      this.childCList = itme;
      let id = itme[0].ID
      // check id exists
      if (this.storeCategory[id]) {
        this.storeCategory[id] = parentList;
      } else {
        // If object keys zero then assign parent ids
        if (Object.keys(this.storeCategory).length == 0) {
          this.storeCategory['parent'] = id;
        };
        // Push new object of array
        this.storeCategory[id] = {};
        this.storeCategory[id] = parentList;
      }
    }
  }

  // Print child up category 
  childCategoryUp(itme): void { 
    // Check zero index ids
    if (itme && itme[0] && itme[0].ID) {
      // If parent and traget id matached then assign empty array 
      if (this.storeCategory['parent'] == itme[0].ID) {
        this.childCList = [];
        this.storeCategory = {};
      } else {
        // Push parent array according to target index
        if (this.storeCategory[itme[0].ID]) {
          this.childCList = this.storeCategory[itme[0].ID];
        } else {
          this.childCList = [];
          this.storeCategory = {};
        }
      }
    }
  }

  // Print child down menu 
  childMList: any;
  storeMenu = {};
  childMenu(itme, parentList): void {
    // Check zero index ids
    if (itme && itme[0] && itme[0].ID) {
      this.childMList = itme;
      let id = itme[0].ID
      // check id exists
      if (this.storeMenu[id]) {
        this.storeMenu[id] = parentList;
      } else {
        // If object keys zero then assign parent ids
        if (Object.keys(this.storeMenu).length == 0) {
          this.storeMenu['parent'] = id;
        };
        // Push new object of array
        this.storeMenu[id] = {};
        this.storeMenu[id] = parentList;
      }
    }
  }

  // Print child up menu 
  childMenuUp(itme): void {
    // Check zero index ids
    if (itme && itme[0] && itme[0].ID) {
      // If parent and traget id matached then assign empty array 
      if (this.storeMenu['parent'] == itme[0].ID) {
        this.childMList = [];
        this.storeMenu = {};
      } else {
        // Push parent array according to target index
        if (this.storeMenu[itme[0].ID]) {
          this.childMList = this.storeMenu[itme[0].ID];
        } else {
          this.childMList = [];
          this.storeMenu = {};
        }
      }
    }
  }
}
