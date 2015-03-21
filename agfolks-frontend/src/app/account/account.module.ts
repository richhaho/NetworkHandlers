import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Routing component mange routing and import custom component.
import { AccountRoutingModule } from './account-routing.module';

// Import shared module
import { SharedModule } from '../shared/shared.module';

//export const options: Partial<IConfig> | (() => Partial<IConfig>);

@NgModule({
  declarations: [
    AccountRoutingModule.component,
    ],
  imports: [
    CommonModule,
    AccountRoutingModule,
    SharedModule
  ]
})
export class AccountModule { }
