import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { NotFoundComponent } from '../pages/miscellaneous/not-found/not-found.component';
import { HomeComponent } from '../home.component';
import { NoPermissionComponent } from '../pages/miscellaneous/no-permissions/no-permission.component';

const routes: Routes = [
	{
		path: '',
		component: HomeComponent,
	},
	{
		path: 'error',
		component: NoPermissionComponent,
	},
	{
		path: 'projects',
		loadChildren: () => import('./projects/projects.module')
			.then(m => m.ProjectsModule),
	},
	{
		path: 'settings',
		loadChildren: () => import('./settings/settings.module')
			.then(m => m.SettingsModule),
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
