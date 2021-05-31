import { InjectionToken, ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule, PathLocationStrategy, LocationStrategy } from '@angular/common';

import { NB_AUTH_TOKEN_INTERCEPTOR_FILTER, NbAuthModule, NbDummyAuthStrategy } from '@nebular/auth';
import { NbSecurityModule, NbRoleProvider } from '@nebular/security';
import { NbFirebaseAuthModule } from '@nebular/firebase-auth';

import { AngularFireModule, FIREBASE_OPTIONS } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireStorageModule } from '@angular/fire/storage'
import { /* AngularFireDatabase, */ AngularFireDatabaseModule } from '@angular/fire/database';
import { AngularFireFunctionsModule } from '@angular/fire/functions';

import { NgxsModule } from '@ngxs/store';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';

import { of as observableOf } from 'rxjs';

import { throwIfAlreadyLoaded } from './module-import-guard';
import {
	BreadcrumbsService,
	PlayerService,
	// AuthGuardService,
	LayoutService,
	PipelineService,
} from './utils';
import { SmartTableData } from './data/smart-table';

import { SmartTableService } from './mock/smart-table.service';
import { MockDataModule } from './mock/mock-data.module';

import { AppState } from './data/state/app.state';
import { UserData, UserState, UserService } from './data/state/users';

import { LanguageService, ProjectData, ProjectsService, ProjectsState } from '@app-core/data/state/projects';
import { TableData, TablesService, TablesState } from '@app-core/data/state/tables';
import { NodeEditorService, NodeEditorState } from '@app-core/data/state/node-editor';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
// import { AngularPrismaDatabase, PrismaService } from '@app-core/utils/prisma';
import { DatabaseService } from '@app-core/utils/database.service';
// import { AngularPrismaAuth } from '@app-core/auth/auth.service';
import { environment } from '../../environments/environment';
import { AngularPrismaModule } from '@app-core/utils/firebase/AngularPrismaModule';
// import { AuthModule } from '@app-core/auth/auth.module';

const socialLinks = [
	{
		url: 'https://github.com/akveo/nebular',
		target: '_blank',
		icon: 'github',
	},
	{
		url: 'https://www.facebook.com/akveo/',
		target: '_blank',
		icon: 'facebook',
	},
	{
		url: 'https://twitter.com/akveo_inc',
		target: '_blank',
		icon: 'twitter',
	},
];

const DATA_SERVICES = [
	{ provide: UserData, useClass: UserService },
	{ provide: ProjectData, useClass: ProjectsService },
	{ provide: TableData, useClass: TablesService },
	{ provide: SmartTableData, useClass: SmartTableService },
	// { provide: FirebaseService, useClass: PrismaService },
	// { provide: AngularFireDatabase, useClass: AngularPrismaDatabase },
];

export class NbSimpleRoleProvider extends NbRoleProvider {
	getRole() {
		// here you could provide any role based on any auth flow
		return observableOf('guest');
	}
}

export const NB_CORE_PROVIDERS = [
	...MockDataModule.forRoot().providers,
	...DATA_SERVICES,
	...NbAuthModule.forRoot({
		strategies: [
			NbDummyAuthStrategy.setup({
				name: 'email',
				delay: 3000,
			}),
		],
		forms: {
			login: {
				socialLinks: socialLinks,
			},
			register: {
				socialLinks: socialLinks,
			},
		},
	}).providers,

	NbSecurityModule.forRoot({
		accessControl: {
			guest: {
				view: '*',
			},
			user: {
				parent: 'guest',
				create: '*',
				edit: '*',
				remove: '*',
			},
		},
	}).providers,

	{
		provide: NbRoleProvider, useClass: NbSimpleRoleProvider,
	},

	{
		provide: LocationStrategy, useClass: PathLocationStrategy,
	},
];

export const CUSTOM_PROVIDERS = [
	// Custom made service
	FirebaseService,
	UserService,
	FirebaseRelationService,
	BreadcrumbsService,
	NodeEditorService,
	PipelineService,
	LanguageService,
	LayoutService,
	PlayerService,
	// AuthGuardService,
	// AuthGuard,
	// AngularPrismaAuth,
	DatabaseService,
];

@NgModule({
	imports: [
		CommonModule,
		AngularFireDatabaseModule,
		AngularFireAuthModule,
		AngularFireFunctionsModule,
		AngularFireStorageModule,
		AngularPrismaModule.initializeApp(),
		// AuthModule.initializeApp(environment.prisma),

		NbFirebaseAuthModule,

		NgxsModule.forRoot([
			AppState,
			UserState,
			ProjectsState,
			TablesState,
			NodeEditorState,
		], { developmentMode: !environment.production }),
		NgxsReduxDevtoolsPluginModule.forRoot({ maxAge: 25 }),
	],
	exports: [
		NbAuthModule,
	],
})
export class CoreModule {
	constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
		throwIfAlreadyLoaded(parentModule, 'CoreModule');
	}

	static forRoot(): ModuleWithProviders<CoreModule> {
		return <ModuleWithProviders<CoreModule>>{
			ngModule: CoreModule,
			providers: [
				...NB_CORE_PROVIDERS,
				...CUSTOM_PROVIDERS,
			],
		};
	}
}
