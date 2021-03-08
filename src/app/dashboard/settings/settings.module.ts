import { NgModule } from '@angular/core';
import { SettingsRoutingModule } from './settings-routing.module';
import { SettingsComponent } from './settings.component';
import { MiscellaneousModule } from '../../pages/miscellaneous/miscellaneous.module';
import { ThemeModule } from '@app-theme/theme.module';
import { NbMenuModule } from '@nebular/theme';

const LIB_MODULES: any[] = [
	MiscellaneousModule,
];

@NgModule({
	imports: [
		...LIB_MODULES,

		SettingsRoutingModule,
		ThemeModule,
		NbMenuModule,
	],
	declarations: [
		SettingsComponent,
	],
})
export class SettingsModule { }
