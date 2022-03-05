import { NgModule } from '@angular/core';
import {
	NbButtonModule,
	NbCardModule,
	NbContextMenuModule, NbLayoutModule,
	NbMenuModule,
	NbSpinnerModule,
	NbStepperModule,
} from '@nebular/theme';

import { ThemeModule } from '@app-theme/theme.module';
import { IntroRoutingModule } from './intro-routing.module';
import { MiscellaneousModule } from '../miscellaneous/miscellaneous.module';
import { IntroComponent } from './intro.component';
import {HomeComponent} from './home.component';
import { FormsModule } from '@angular/forms';
import { LayoutService } from '../../_core/utils';

const NB_MODULES = [
	NbMenuModule,
	NbStepperModule,
	NbCardModule,
	NbButtonModule,
	NbContextMenuModule,
	NbSpinnerModule,
	NbLayoutModule,
];

const CUSTOM_PROVIDERS = [
	LayoutService,
];

@NgModule({
	imports: [
		IntroRoutingModule,
		FormsModule,
		ThemeModule,
		MiscellaneousModule,
		...NB_MODULES,
	],
	declarations: [
		IntroComponent,
		HomeComponent,
	],
	providers: [
		...CUSTOM_PROVIDERS,
	],
})
export class IntroModule
{
}
