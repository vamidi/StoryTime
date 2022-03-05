/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { APP_INITIALIZER, Inject, Injectable, NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClientModule, HttpRequest } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import {
	NbAlertModule, NbButtonModule, NbCardModule,
	NbChatModule, NbCheckboxModule,
	NbDatepickerModule,
	NbDialogModule, NbFormFieldModule, NbIconModule, NbInputModule, NbLayoutModule,
	NbMenuModule,
	NbSidebarModule,
	NbToastrModule,
	NbWindowModule,
} from '@nebular/theme';

import {
	NbAuthJWTInterceptor,
	NB_AUTH_TOKEN_INTERCEPTOR_FILTER,
} from '@nebular/auth';

import { ThemeModule } from '@app-theme/theme.module';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { HomeComponent } from '@app-dashboard/home.component';
import { CoreModule } from '@app-core/core.module';

function nbNoOpInterceptorFilter(req: HttpRequest<any>) {
	return req.url === '/refresh';
}

@NgModule({
	declarations: [
		AppComponent,
		HomeComponent,
	],
	providers: [
		// NbPrismaPasswordStrategy,
		{ provide: NB_AUTH_TOKEN_INTERCEPTOR_FILTER, useValue: nbNoOpInterceptorFilter },
		{ provide: HTTP_INTERCEPTORS, useClass: NbAuthJWTInterceptor, multi: true },
	],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		HttpClientModule,
		FormsModule,
		AppRoutingModule,

		CoreModule.forRoot(),
		ThemeModule.forRoot(),

		NbSidebarModule.forRoot(),
		NbMenuModule.forRoot(),
		NbDatepickerModule.forRoot(),
		NbDialogModule.forRoot(),
		NbWindowModule.forRoot(),
		NbToastrModule.forRoot(),
		NbAlertModule,
		NbInputModule,
		NbChatModule.forRoot({
			messageGoogleMapKey: 'AIzaSyA_wNuCzia92MAmdLRzmqitRGvCF7wCZPY',
		}),

		NbCheckboxModule,
		NbButtonModule,
		NbIconModule,
		NbCardModule,
		ThemeModule,

		// own modules
		NbFormFieldModule,
		NbLayoutModule,
	],
	bootstrap: [AppComponent],
})
export class AppModule {
}
