/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *
 * WARNING this file is being replaced by postinstall-web.js
 */
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { APP_CONFIG } from '@app-core/data/app.config';


let PATH_TO_CONFIG = '';
if(environment.production && !!(window && window.process && window.process.type))
{
	const path = window.require('path');
	PATH_TO_CONFIG = path.join(process.resourcesPath, 'assets/data', 'config.json');
}

if(!environment.production)
{
	PATH_TO_CONFIG = './assets/data/config.json'
}

fetch(PATH_TO_CONFIG)
.then((response) => response.json())
.then((config) => {
	if (environment.production) {
		enableProdMode()
	}

	platformBrowserDynamic([{ provide: APP_CONFIG, useValue: config }])
	.bootstrapModule(AppModule)
	.catch((err) => console.error(err))
});
