import { ModuleWithProviders, NgModule } from '@angular/core';
import { AngularFireModule, FIREBASE_OPTIONS } from '@angular/fire/compat';
import { FirebaseAppSettings, FirebaseOptions } from 'firebase/app';
import { APP_CONFIG } from '@app-core/data/app.config';
import { IEnvironment } from '@app-core/interfaces/environment.interface';

@NgModule()
export class AngularPrismaModule extends AngularFireModule
{
	static initializeApp(options?: FirebaseOptions, nameOrConfig?: string | FirebaseAppSettings | null): ModuleWithProviders<AngularPrismaModule>
	{
		const app = AngularFireModule.initializeApp(options ?? {}, nameOrConfig)
		return {
			...app,
			ngModule: AngularPrismaModule,
			providers: [{ provide: FIREBASE_OPTIONS, useFactory: (config: IEnvironment) => config.firebase, deps: [APP_CONFIG]}],
		};
	}
}
