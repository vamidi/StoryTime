import { NgModule } from '@angular/core';
import { ProfileRoutingModule } from './profile-routing.module';
import { ProfileComponent } from './profile.component';
import { NbAlertModule, NbButtonModule, NbCardModule, NbInputModule, NbTabsetModule } from '@nebular/theme';
import { UserService } from '@app-core/data/state/users';
import { ThemeModule } from '@app-theme/theme.module';

const LIB_MODULES: any[] = [
	NbCardModule,
	NbInputModule,
	NbButtonModule,
	ThemeModule,
];

@NgModule({
	imports: [
		...LIB_MODULES,

		ProfileRoutingModule,
		NbTabsetModule,
		NbAlertModule,
	],
	declarations: [
		ProfileComponent,
	],
	providers: [
		UserService,
	],
})
export class ProfileModule {
}
