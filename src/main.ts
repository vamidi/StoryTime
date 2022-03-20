/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *
 */
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { APP_CONFIG } from '@app-core/data/app.config';

import { environment } from './environments/environment';
import { AppModule } from './app/app.module';

if (environment.production) {
	enableProdMode();
}

platformBrowserDynamic([{ provide: APP_CONFIG, useValue: environment }])
	.bootstrapModule(AppModule)
	.catch(err => console.error(err));
