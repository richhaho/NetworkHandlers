import { Component, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { CategoryService } from '../../services/category/category.service';

// Import environment config file.
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.sass']
})
export class CategoryComponent implements OnInit {
  CID: number = environment.config.CID;
  PORTAL_URL: string = environment.config.PORTAL_URL;
  categoryList: any = [];

  constructor(
    private CategoryService: CategoryService,
    private router: Router) { }

  ngOnInit() {
    // This service subscribe category list
    this.CategoryService.castCategory.subscribe(categoryList => this.categoryList = categoryList);
  }

  // redirect to page according to url
  changeRouter(slug): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.navigateByUrl(slug, { replaceUrl: true });
  }
  
}
