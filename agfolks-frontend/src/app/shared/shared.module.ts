import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

// This for internationalization language.
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { TruncatePipe } from './pipe/truncate.pipe';
import { SafeHtmlPipe } from './pipe/safe-html.pipe';

// Load all ngx bootstrap modules.
import { TooltipModule, ModalModule, PopoverModule, AccordionModule } from 'ngx-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// For error 
import { ToastrModule } from 'ngx-toastr';

// For Input Masking
import { NgxMaskModule } from 'ngx-mask';

// added global component
import { NewsletterComponent } from '../newsletter/newsletter.component'
import { BreadCrumbsComponent } from '../bread-crumbs/bread-crumbs.component';

// AoT requires an exported function for factories and this for language
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

@NgModule({
  imports: [CommonModule,
    TooltipModule.forRoot(),
    ModalModule.forRoot(),
    PopoverModule.forRoot(),
    AccordionModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    ToastrModule.forRoot({
      timeOut: 2000,
      positionClass: 'toast-top-center'
    }),
    ReactiveFormsModule,
    FormsModule,
    NgxMaskModule.forRoot(),
  ],
  exports: [
    TruncatePipe,
    SafeHtmlPipe,
    TranslateModule,
    TooltipModule,
    ModalModule,
    PopoverModule,
    AccordionModule,
    ToastrModule,
    NewsletterComponent,
    BreadCrumbsComponent,
    ReactiveFormsModule,
    FormsModule,
    NgxMaskModule,
  ],
  declarations: [
    TruncatePipe,
    SafeHtmlPipe,
    NewsletterComponent,
    BreadCrumbsComponent
  ]
})
export class SharedModule { }