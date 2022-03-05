import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { NotFoundComponent } from '../miscellaneous/not-found/not-found.component';
import { IntroComponent } from './intro.component';
import { HomeComponent } from './home.component';
import { IntroGuard } from '@app-core/guards/intro-guard';

const routes: Routes = [
	{
		path: '',
		component: HomeComponent,
		children: [
			{
				path: '',
				component: IntroComponent,
				canActivate: [ /* NbAngularPrismaAuthGuard */ IntroGuard ],
			},
			{
				path: '**',
				component: NotFoundComponent,
			},
		],
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class IntroRoutingModule
{
}
