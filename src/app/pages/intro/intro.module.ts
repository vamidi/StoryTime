import { NgModule } from '@angular/core';
import {
	NbButtonModule,
	NbCardModule,
	NbContextMenuModule,
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

const NB_MODULES = [
	NbMenuModule,
	NbStepperModule,
	NbCardModule,
	NbButtonModule,
	NbContextMenuModule,
	NbSpinnerModule,
]

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
})
export class IntroModule
{
}
