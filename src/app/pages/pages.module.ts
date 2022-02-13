import { NgModule } from '@angular/core';
import { NbContextMenuModule, NbMenuModule, NbStepperModule } from '@nebular/theme';

import { ThemeModule } from '@app-theme/theme.module';
import { PagesComponent } from './pages.component';
import { PagesRoutingModule } from './pages-routing.module';
import { MiscellaneousModule } from './miscellaneous/miscellaneous.module';

@NgModule({
	imports: [
		PagesRoutingModule,
		ThemeModule,
		NbMenuModule,
		NbStepperModule,
		MiscellaneousModule,
		NbContextMenuModule,
	],
	declarations: [
		PagesComponent,
	],
})
export class PagesModule
{
}
