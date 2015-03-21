import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

//import component 
import { AccountComponent } from './account/account.component';
import { MyAccountComponent } from './my-account/my-account.component';
import { ProfileComponent } from './profile/profile.component'
import { ChangePasswordComponent } from './change-password/change-password.component'
import { OrderHistoryComponent } from './order-history/order-history.component';
import { OrderDetailsComponent } from './order-details/order-details.component';
import { TrackMyOrderComponent } from './track-my-order/track-my-order.component';
import { SideBarComponent } from './side-bar/side-bar.component';
import { WishListComponent } from './wish-list/wish-list.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { EditAddressComponent } from './edit-address/edit-address.component';
import { ShippingAddressComponent } from './shipping-address/shipping-address.component';

import { AuthGuard } from '../guards';

// Manage routing 
const routes: Routes = [
  {
    path: '',
    component: MyAccountComponent,
    children: [{
      path: '',
      component: AccountComponent, canActivate: [AuthGuard]
    }, {
      path: 'profile',
      component: ProfileComponent, canActivate: [AuthGuard]

    }, {
      path: 'shipping-addresses',
      component: ShippingAddressComponent, canActivate: [AuthGuard]

    }, {
      path: 'change-password',
      component: ChangePasswordComponent, canActivate: [AuthGuard]
    }, {
      path: 'order-history',
      component: OrderHistoryComponent, canActivate: [AuthGuard]
    }, {
      path: 'order-detail/:id',
      component: OrderDetailsComponent, canActivate: [AuthGuard]
    }, {
      path: 'track-my-order',
      component: TrackMyOrderComponent, canActivate: [AuthGuard]
    }, {
      path: 'wish-list',
      component: WishListComponent, canActivate: [AuthGuard]
    }, {
      path: 'edit-profile',
      component: EditProfileComponent, canActivate: [AuthGuard]
    }, {
      path: 'edit-address',
        component: EditAddressComponent, canActivate: [AuthGuard]
    },
      {
        path: 'edit-address/:id',
        component: EditAddressComponent, canActivate: [AuthGuard]
      }
    ]
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountRoutingModule {
  static component = [MyAccountComponent, AccountComponent, ProfileComponent, ChangePasswordComponent,
    OrderHistoryComponent, OrderDetailsComponent,TrackMyOrderComponent, SideBarComponent, WishListComponent, EditProfileComponent,EditAddressComponent,ShippingAddressComponent
  ];
}

