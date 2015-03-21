import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MustMatch } from '../_helpers/must-match.validator';

/*
 * Import the service
 */
import { UserService } from '../../services/auth/user.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './manufacturer-signup/manufacturer-signup.component.html',
  styleUrls: ['./manufacturer-signup/manufacturer-signup.component.sass']
})
export class ManufacturerSignupComponent implements OnInit {
  userForm;
  url: string = environment.config.API_URL;
  constructor(
      private userService: UserService,
      private router: Router,
      private formBuilder: FormBuilder,
      private http: HttpClient,
      // private httpHeader: HttpHeaders
  ) {}

  ngOnInit() {
    this.userForm = this.formBuilder.group({
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address1: ['', [Validators.required]],
      phone: ['', Validators.required],
      address2: ['', [Validators.required]],
      state: ['', [Validators.required]],
      city: ['', [Validators.required]],
      zip: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmpass: ['', [Validators.required]],
      notifyme: [''],
      acceptpolicy: ['', [Validators.required]]
    }, {
       validator: MustMatch('password', 'confirmpass')
    });
  }
  onSubmit(customerData) {
    this.markFormGroupDirtied(this.userForm);
    if (this.userForm.valid) {
      this.userService.registerUser(customerData)
          .subscribe((res) => {
            console.log(res);
          });
    } else {
      console.log(this.userForm);
    }
  }
  private markFormGroupDirtied(formGroup: FormGroup) {
    (<any> Object).values(formGroup.controls).forEach(control => {
      control.markAsDirty();

      if (control.controls) {
        this.markFormGroupDirtied(control);
      }
    });
  }
  // redirect to page according to url
  changeRouter(slug): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.navigateByUrl(slug, { replaceUrl: true });
  }
}
