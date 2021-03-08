import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule, PathLocationStrategy, LocationStrategy } from '@angular/common';
import { NbAuthModule, NbDummyAuthStrategy } from '@nebular/auth';
import { NbSecurityModule, NbRoleProvider } from '@nebular/security';
import { of as observableOf } from 'rxjs';

import { throwIfAlreadyLoaded } from './module-import-guard';
import {
	BreadcrumbsService,
	PlayerService,
	AuthGuardService,
	AuthService as AuthGuard,
	LayoutService,
} from './utils';
import { UserData } from './data/users';
import { SmartTableData } from './data/smart-table';

import { SmartTableService } from './mock/smart-table.service';
import { MockDataModule } from './mock/mock-data.module';

import { UserService } from '@app-core/data/users.service';

import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireStorageModule } from '@angular/fire/storage'
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { AngularFireFunctionsModule } from '@angular/fire/functions';
import { environment } from '../../environments/environment';
import { FirebaseService } from '@app-core/utils/firebase.service';
import { FirebaseRelationService } from '@app-core/utils/firebase-relation.service';
import { ProjectData } from '@app-core/data/project';
import { ProjectService } from '@app-core/data/projects.service';
import { TableData } from '@app-core/data/table';
import { TablesService } from '@app-core/data/tables.service';
import { NodeEditorService } from '@app-core/data/node-editor.service';

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
	{ provide: ProjectData, useClass: ProjectService },
	{ provide: TableData, useClass: TablesService },
	{ provide: SmartTableData, useClass: SmartTableService },
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

	BreadcrumbsService,
	UserService,
	NodeEditorService,
	LayoutService,
	PlayerService,
	AuthGuardService,
	AuthGuard,
];

export const CUSTOM_PROVIDERS = [
	// Custom made service
	FirebaseService,
	FirebaseRelationService,
];

@NgModule({
	imports: [
		CommonModule,
		AngularFireDatabaseModule,
		AngularFireAuthModule,
		AngularFireFunctionsModule,
		AngularFireStorageModule,
		AngularFireModule.initializeApp(environment.firebase, 'management-buas'),
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
