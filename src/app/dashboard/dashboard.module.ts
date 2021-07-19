import { NgModule } from '@angular/core';
import { ThemeModule } from '@app-theme/theme.module';
import { NbButtonModule, NbCardModule, NbMenuModule } from '@nebular/theme';
import { RouterModule } from '@angular/router';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { HomeComponent } from './home.component';
import { DashboardComponent } from './dashboard.component';
import { MiscellaneousModule } from '../pages/miscellaneous/miscellaneous.module';
import { NoPermissionComponent } from '../pages/miscellaneous/no-permissions/no-permission.component';

@NgModule({
	imports: [
		ThemeModule,
		NbCardModule,
		NbButtonModule,
		NbMenuModule,

		DashboardRoutingModule,
		MiscellaneousModule,
		RouterModule,
	],
	exports: [
		DashboardComponent,
	],
	declarations: [
		DashboardComponent,
		HomeComponent,
		NoPermissionComponent,
	],
})
export class DashboardModule { }
