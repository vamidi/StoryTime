import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { NotFoundComponent } from '../pages/miscellaneous/not-found/not-found.component';
import { NoPermissionComponent } from '../pages/miscellaneous/no-permissions/no-permission.component';
import { DashboardComponent } from './dashboard.component';
import { DashboardHomeComponent } from '@app-dashboard/dashboard-home.component';
import { AuthGuard } from '@app-core/guards/auth-guard';
import { redirectUnauthorizedToLogin } from '../pages/auth/auth-functions';

const routes: Routes = [
	{
		path: '',
		component: DashboardComponent,
		children: [
			{ path: '', component: DashboardHomeComponent },
		],
		canActivate: [ /* NbAngularPrismaAuthGuard */ AuthGuard ],
		data: { authGuardPipe: redirectUnauthorizedToLogin },
	},
	{
		path: 'projects',
		component: DashboardComponent,
		loadChildren: () => import('./projects/projects.module')
			.then(m => m.ProjectsModule),
		canActivate: [ /* NbAngularPrismaAuthGuard */ AuthGuard ],
		data: { authGuardPipe: redirectUnauthorizedToLogin },
	},
	{
		path: 'settings',
		component: DashboardComponent,
		loadChildren: () => import('./settings/settings.module')
			.then(m => m.SettingsModule),
		canActivate: [ /* NbAngularPrismaAuthGuard */ AuthGuard ],
		data: { authGuardPipe: redirectUnauthorizedToLogin },
	},
	{
		path: 'error',
		component: NoPermissionComponent,
	},
	{
		path: '**',
		component: NotFoundComponent,
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class DashboardRoutingModule
{
}
