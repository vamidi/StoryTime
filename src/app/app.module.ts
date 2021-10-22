/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { APP_INITIALIZER, Inject, Injectable, NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClientModule, HttpRequest } from '@angular/common/http';
import { AngularFireAuthGuard } from '@angular/fire/auth-guard';
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
import { NbAuthSocialLink } from '@nebular/auth/auth.options';

import {
	NbAuthModule,
	NbAuthJWTToken,
	NbAuthJWTInterceptor,
	NB_AUTH_TOKEN_INTERCEPTOR_FILTER,
	getDeepFromObject,
} from '@nebular/auth';

import { CoreModule } from '@app-core/core.module';
import { ThemeModule } from '@app-theme/theme.module';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

/* import {
	NbPrismaPasswordStrategy, NbPrismaPasswordStrategyOptions
} from './_core/strategies/prisma-password.strategy'; */

import { NbFirebasePasswordStrategy, NbFirebasePasswordStrategyOptions } from '@nebular/firebase-auth';

import { NgxFirebaseLoginComponent } from './pages/auth/firebase-login.component';
import { NgxFirebaseRegisterComponent } from './pages/auth/firebase-register.component';
import { NgxFirebaseLogoutComponent } from './pages/auth/firebase-logout.component';
import { DashboardModule } from './dashboard/dashboard.module';
import { NgxInviteComponent } from './pages/invitation/invite.component';
import { HomeComponent } from '@app-dashboard/home.component';

export function nbNoOpInterceptorFilter(req: HttpRequest<any>) {
	return req.url === '/refresh';
}

export function getter(module: string, res: any, options: NbFirebasePasswordStrategyOptions,
/* NbPrismaPasswordStrategyOptions */) {
	return getDeepFromObject(res, options.errors.key, options[module].defaultErrors);
}

export function messageGetter(module: string, res: any, options: NbFirebasePasswordStrategyOptions,
/* NbPrismaPasswordStrategyOptions */) {
	getDeepFromObject(res.body, options.messages.key, options[module].defaultMessages);
}

const socialLinks: NbAuthSocialLink[] = [];

@NgModule({
	declarations: [
		AppComponent,
		HomeComponent,
		NgxFirebaseLoginComponent,
		NgxFirebaseRegisterComponent,
		NgxFirebaseLogoutComponent,
		NgxInviteComponent,
	],
	providers: [
		AngularFireAuthGuard,
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
		CoreModule.forRoot(),

		NbAuthModule.forRoot({
			strategies: [
				/* NbPrismaPasswordStrategy */
				NbFirebasePasswordStrategy.setup({
					// baseEndpoint: 'https://buas.vamidicreations.nl/core',
					name: 'password',

					token: {
						class: NbAuthJWTToken,
					},
					errors: {
						key: '',
						getter: getter,
					},
					messages: {
						key: '',
						getter: messageGetter,
					},
					login: {
						endpoint: '/authenticate',
						method: 'post',
						requireValidToken: false,
						redirect: {
							success: '/dashboard',
							failure: null,
						},
						defaultMessages: ['successfully logged in'],
					},
					logout: {
						endpoint: '/logout',
						method: 'delete',
						redirect: {
							success: '/auth/login',
							failure: null,
						},
						requireValidToken: true,
						defaultErrors: ['Something went wrong, please try again.'],
						defaultMessages: ['You have been successfully logged out.'],
					},
					register: {
						endpoint: '/logout',
						method: 'post',
						redirect: {
							success: '/dashboard',
							failure: null,
						},
						defaultErrors: ['Something went wrong, please try again.'],
						defaultMessages: ['You have been successfully logged out.'],
					},
					refreshToken: {
						endpoint: '/refresh',
						method: 'post',
					},
				}),

			],
			forms: {
				login: {
					strategy: 'password',
					redirectDelay: 150,
					socialLinks: socialLinks,
				},
				register: {
					strategy: 'password',
					redirectDelay: 150,
					socialLinks: socialLinks,
				},
				logout: {
					strategy: 'password',
					redirectDelay: 150,
				},
			},
		}),

		NbCheckboxModule,
		NbButtonModule,
		NbIconModule,
		NbCardModule,
		ThemeModule,

		// own modules
		DashboardModule,
		NbFormFieldModule,
		NbLayoutModule,
	],
	bootstrap: [AppComponent],
})
export class AppModule {
}
