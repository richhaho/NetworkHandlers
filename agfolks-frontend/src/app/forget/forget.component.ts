import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {UserService} from "../services/auth/user.service";
import {ToastrService} from "ngx-toastr";
import {environment} from "../../environments/environment";

@Component({
  selector: 'app-forget',
  templateUrl: './forget.component.html',
  styleUrls: ['./forget.component.sass']
})
export class ForgetComponent implements OnInit {

  forgetForm;
  successMsg;
  CID: Number = environment.config.CID;
  constructor(
      private router: Router,
      private formBuilder: FormBuilder,
      private userService: UserService,
      private toast: ToastrService,
  ) { }

  ngOnInit() {
    this.forgetForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  // redirect to page according to url
  changeRouter(slug): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.navigateByUrl(slug, { replaceUrl: true });
  }

  onSubmit(data) {
    data['cid'] = this.CID;
    this.markFormGroupDirtied(this.forgetForm);
    if (this.forgetForm.valid) {
      this.userService.forgotPassword(data).subscribe(resp => {
        if (resp && resp.data) {
          this.successMsg = resp['data'];
        }
      }, error => {
        if (error.error.error) {
          this.toast.error(error.error.error);
        }
      })
    } else {
      console.log(this.forgetForm);
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

}
