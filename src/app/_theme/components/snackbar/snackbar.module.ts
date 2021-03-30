import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NbButtonModule, NbIconModule, NbOverlayModule } from '@nebular/theme';
import { NbSnackbarContainerRegistry, NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';
import { NB_SNACKBAR_CONFIG, NbSnackbarConfig } from '@app-theme/components/snackbar/snackbar-config';
import { NbSnackbarComponent, NbSnackbarContainerComponent } from '@app-theme/components';

@NgModule({
	imports: [
		CommonModule,
		NbOverlayModule,
		NbIconModule,
		NbButtonModule,
	],
	declarations: [NbSnackbarContainerComponent, NbSnackbarComponent],
	entryComponents: [NbSnackbarContainerComponent, NbSnackbarComponent],
})
export class NbSnackbarModule {
	static forRoot(snackbarConfig: Partial<NbSnackbarConfig> = {}): ModuleWithProviders<NbSnackbarModule> {
		return <ModuleWithProviders<NbSnackbarModule>>{
			ngModule: NbSnackbarModule,
			providers: [
				NbSnackbarService,
				NbSnackbarContainerRegistry,
				{ provide: NB_SNACKBAR_CONFIG, useValue: snackbarConfig },
			],
		};
	}
}
