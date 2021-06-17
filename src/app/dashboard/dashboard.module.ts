import { NgModule } from '@angular/core';
import { ThemeModule } from '@app-theme/theme.module';
import { NbButtonModule, NbCalendarModule, NbCardModule, NbMenuModule } from '@nebular/theme';
import { RouterModule } from '@angular/router';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { MiscellaneousModule } from '../pages/miscellaneous/miscellaneous.module';
import { HomeComponent } from '../home.component';
import { NoPermissionComponent } from '../pages/miscellaneous/no-permissions/no-permission.component';
import { DashboardHomeComponent } from '@app-dashboard/dashboard-home.component';

@NgModule({
	imports: [
		ThemeModule,
		NbCardModule,
		NbButtonModule,
		NbMenuModule,
		NbCalendarModule,

		DashboardRoutingModule,
		MiscellaneousModule,

		RouterModule,
	],
	exports: [
		DashboardComponent,
	],
	declarations: [
		DashboardComponent,
		DashboardHomeComponent,
		NoPermissionComponent,
	],
})
export class DashboardModule { }
