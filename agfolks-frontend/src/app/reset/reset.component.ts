import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {UserService} from "../services/auth/user.service";

@Component({
  selector: 'app-reset',
  templateUrl: './reset.component.html',
  styleUrls: ['./reset.component.sass']
})
export class ResetComponent implements OnInit {

  resetForm;
  successMsg;
  passwordToken;
  constructor(
      private router: Router,
      private formBuilder: FormBuilder,
      private userService: UserService,
      private route: ActivatedRoute,
  ) {
    this.route.paramMap.subscribe(params => {
      this.passwordToken = params.get('token');
    });
  }

  ngOnInit() {
    this.resetForm = this.formBuilder.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(data) {
    this.markFormGroupDirtied(this.resetForm);
    if (this.resetForm.valid && data['password'] === data['confirm']) {
      const payload = {
        'newPassword': data['password'],
        'passwordToken': this.passwordToken
      };
      this.userService.resetPassword(payload).subscribe(resp => {
        if (resp && resp.data) {
          this.successMsg = resp.data;
        } else {
          console.log(resp.error);
        }
      })
    } else {
      console.log(this.resetForm);
    }
  }

  private markFormGroupDirtied(formGroup: FormGroup) {
    (<any>Object).values(formGroup.controls).forEach(control => {
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
