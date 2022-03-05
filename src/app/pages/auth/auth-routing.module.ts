import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NbAuthComponent, NbRequestPasswordComponent, NbResetPasswordComponent } from '@nebular/auth';
import { NgxFirebaseLoginComponent } from './firebase-login.component';
import { AuthGuard } from '@app-core/guards/auth-guard';
import { NgxFirebaseRegisterComponent } from './firebase-register.component';
import { NgxFirebaseLogoutComponent } from './firebase-logout.component';
import { NgxInviteComponent } from '../invitation/invite.component';
import { redirectLoggedInToDatabase, redirectUnauthorizedToLogin } from './auth-functions';

const routes: Routes = [
	{
		path: '',
		component: NbAuthComponent,
		children: [
			{
				path: '',
				component: NgxFirebaseLoginComponent,
				canActivate: [ /* NbAngularPrismaAuthGuard */ AuthGuard ],
				data: { authGuardPipe: redirectLoggedInToDatabase },
			},
			{
				path: 'login',
				component: NgxFirebaseLoginComponent,
				canActivate: [ /* NbAngularPrismaAuthGuard */ AuthGuard ],
				data: { authGuardPipe: redirectLoggedInToDatabase },
			},
			{
				path: 'register',
				component: NgxFirebaseRegisterComponent,
				data: { authGuardPipe: redirectLoggedInToDatabase },
			},
			{
				path: 'logout',
				component: NgxFirebaseLogoutComponent,
			},
			{
				path: 'request-password',
				component: NbRequestPasswordComponent,
			},
			{
				path: 'reset-password',
				component: NbResetPasswordComponent,
				canActivate: [ /* NbAngularPrismaAuthGuard */ AuthGuard ],
				data: { authGuardPipe: redirectUnauthorizedToLogin },
			},
		],
	},
	{
		path: 'invite',
		component: NgxInviteComponent,
		canActivate: [ /* NbAngularPrismaAuthGuard */ AuthGuard],
		data: {authGuardPipe: redirectUnauthorizedToLogin},
	},
]
@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class AuthRoutingModule
{
}
