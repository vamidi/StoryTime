import { ExtraOptions, RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { IntroGuard } from '@app-core/guards/intro-guard';

const routes: Routes = [
	{
		path: 'dashboard',
		loadChildren: () => import('./dashboard/dashboard.module')
			.then(m => m.DashboardModule),
		canActivate: [ /* NbAngularPrismaAuthGuard */ IntroGuard ],
	},
	{
		path: 'intro',
		loadChildren: () => import('./pages/intro/intro.module')
			.then(m => m.IntroModule),
		canActivate: [ /* NbAngularPrismaAuthGuard */ IntroGuard ],
	},
	{
		path: 'auth',
		loadChildren: () => import('./pages/auth/auth.module')
			.then(m => m.AuthModule),
	},
	// TODO change home page.
	{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
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
