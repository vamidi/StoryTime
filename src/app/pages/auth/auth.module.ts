import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NbFirebasePasswordStrategy, NbFirebasePasswordStrategyOptions } from '@nebular/firebase-auth';
import { NbAlertModule, NbButtonModule, NbCheckboxModule, NbIconModule, NbInputModule } from '@nebular/theme';
import { getDeepFromObject, NbAuthJWTToken, NbAuthModule } from '@nebular/auth';
import { NbAuthSocialLink } from '@nebular/auth/auth.options';
import { NgxFirebaseLoginComponent } from './firebase-login.component';
import { NgxFirebaseLogoutComponent } from './firebase-logout.component';
import { NgxFirebaseRegisterComponent } from './firebase-register.component';
import { NgxInviteComponent } from '../invitation/invite.component';
import { AuthRoutingModule } from './auth-routing.module';

export function getter(module: string, res: any, options: NbFirebasePasswordStrategyOptions,
	/* NbPrismaPasswordStrategyOptions */) {
	return getDeepFromObject(res, options.errors.key, options[module].defaultErrors);
}

export function messageGetter(module: string, res: any, options: NbFirebasePasswordStrategyOptions,
	/* NbPrismaPasswordStrategyOptions */) {
	getDeepFromObject(res.body, options.messages.key, options[module].defaultMessages);
}

const socialLinks: NbAuthSocialLink[] = [];

const LIB_MODULES = [
	CommonModule,
	FormsModule,
];

const NB_MODULES = [
	NbAlertModule,
	NbInputModule,
	NbIconModule,
	NbCheckboxModule,
	NbButtonModule,
];

@NgModule({
	imports: [
		...LIB_MODULES,
		...NB_MODULES,
		AuthRoutingModule,

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
	],
	declarations: [
		NgxFirebaseLoginComponent,
		NgxFirebaseLogoutComponent,
		NgxFirebaseRegisterComponent,
		NgxInviteComponent,
	],
})
export class AuthModule {
}
