import { ModuleWithProviders, NgModule } from '@angular/core';
import { AngularFireModule, FIREBASE_OPTIONS, FirebaseAppConfig } from '@angular/fire';
import { APP_CONFIG } from '@app-core/data/app.config';
import { IEnvironment } from '@app-core/interfaces/environment.interface';

@NgModule()
export class AngularPrismaModule extends AngularFireModule
{
	static initializeApp(nameOrConfig?: string | FirebaseAppConfig | null): ModuleWithProviders<AngularPrismaModule>
	{
		const app = AngularFireModule.initializeApp({}, nameOrConfig)
		return {
			...app,
			ngModule: AngularPrismaModule,
			providers: [{ provide: FIREBASE_OPTIONS, useFactory: (config: IEnvironment) => config.firebase, deps: [APP_CONFIG]}],
		};
	}
}
