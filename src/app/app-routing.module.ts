import { ExtraOptions, RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import {
	NbAuthComponent,
	NbRequestPasswordComponent,
	NbResetPasswordComponent,
} from '@nebular/auth';
import { NgxFirebaseLoginComponent } from './pages/auth/firebase-login.component';
// import { AuthGuardService as AuthGuard } from '@app-core/utils/auth.guard.service';
import { NgxFirebaseLogoutComponent } from './pages/auth/firebase-logout.component';

import {
	// hasCustomClaim,
	AngularFireAuthGuard,
	redirectUnauthorizedTo,
	redirectLoggedInTo,
} from '@angular/fire/auth-guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { NgxFirebaseRegisterComponent } from './pages/auth/firebase-register.component';
import { NgxInviteComponent } from './pages/invitation/invite.component';
// import { HomeComponent } from './home.component';

// const adminOnly = () => hasCustomClaim('admin');
const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['auth/login']);
const redirectLoggedInToDatabase = () => redirectLoggedInTo(['dashboard/']);
// const belongsToAccount = (next) => hasCustomClaim(`account-${next.params.id}`);

const routes: Routes = [
	/*{
		path: '',
		component: HomeComponent,
	},*/
	{
		path: 'dashboard',
		component: DashboardComponent,
		loadChildren: () => import('./dashboard/dashboard.module')
			.then(m => m.DashboardModule),
		canActivate: [ AngularFireAuthGuard ],
		data: { authGuardPipe: redirectUnauthorizedToLogin },
	},
	// {
	// 	path: 'projects',
	// 	loadChildren: () => import('app/projects/projects.module')
	// 		.then(m => m.ProjectsModule),
	// 	canActivate: [ AngularFireAuthGuard ],
	// 	data: { authGuardPipe: redirectUnauthorizedToLogin },
	// },
	{
		path: 'auth',
		component: NbAuthComponent,
		children: [
			{
				path: '',
				component: NgxFirebaseLoginComponent,
				canActivate: [ AngularFireAuthGuard ],
				data: { authGuardPipe: redirectLoggedInToDatabase },
			},
			{
				path: 'login',
				component: NgxFirebaseLoginComponent,
				canActivate: [ AngularFireAuthGuard ],
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
				canActivate: [ AngularFireAuthGuard ],
				data: { authGuardPipe: redirectUnauthorizedToLogin },
			},
		],
	},
	{
		path: 'invite',
		component: NgxInviteComponent,
		canActivate: [ AngularFireAuthGuard ],
		data: { authGuardPipe: redirectUnauthorizedToLogin },
	},
	{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
	// { path: '**', redirectTo: 'dashboard' },
];

const config: ExtraOptions = {
	useHash: false,
	paramsInheritanceStrategy: 'always',
};

@NgModule({
	imports: [RouterModule.forRoot(routes, config)],
	exports: [RouterModule],
})
export class AppRoutingModule
{
}
