/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { AfterViewInit, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { KeyValue } from '@angular/common';
import { NbMenuItem, NbSpinnerService } from '@nebular/theme';
import { MENU_ITEMS } from './pages/pages-menu';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { BreadcrumbsService, UtilsService } from '@app-core/utils';
import { Table } from '@app-core/data/state/tables';
import { ElectronService } from '@app-core/utils/electron.service';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { UserPreferences } from '@app-core/utils/utils.service';
import { Subscription } from 'rxjs';

@Component({
	selector: 'ngx-app',
	template: '<router-outlet></router-outlet>',
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy
{
	menu: NbMenuItem[] = MENU_ITEMS;

	public tableItems: KeyValue<string, boolean>[] = [];

	// Main subscription to all events
	protected mainSubscription: Subscription = new Subscription();
	protected userPreferences: UserPreferences = null;

	constructor(
		protected electronService: ElectronService,
		protected userPreferencesService: UserPreferencesService,
		private spinnerService: NbSpinnerService,
		private firebaseService: FirebaseService,
		private breadcrumbService: BreadcrumbsService,
	) { }

	ngOnInit(): void
	{
		// this.spinnerService.registerLoader(this._loadData());
		// get the quests
		// get the main table reference
		this.spinnerService.load();

		this.breadcrumbService.addCallbackForRouteRegex('/pages/game-db/[a-zA-Z]', (id) => UtilsService.titleCase(id).replace(/%20/g, ' '));


		this.mainSubscription.add(
			this.userPreferencesService.getUserPreferences().subscribe((userPreferences: UserPreferences) => {
				this.userPreferences = { ...userPreferences };
			}),
		);
	}

	public ngAfterViewInit()
	{
		if(this.userPreferences.introSet && this.electronService.isElectron)
			this.electronService.ipcRenderer.send('startServer');
	}

	public ngOnDestroy()
	{
		this.mainSubscription.unsubscribe();
	}

	public onDataReceived(tableData: Table)
	{
		for(const [key, value] of Object.entries(tableData.data))
		{
			if (!this.firebaseService.getExcludedTables().includes(key))
			{
				const payload: any = value;

				let tableName = key;
				tableName = tableName.replace(/([A-Z])/g, ' $1').trim();
				tableName = tableName.charAt(0).toUpperCase() + tableName.substr(1);

				const firstEl: NbMenuItem = this.menu[0];

				if (!firstEl.children.find(child => child.title === tableName))
				{
					firstEl.children.push(
						{
							title: tableName,
							icon: 'chevron-right-outline',
							link: '/pages/game-db/' + key,
							hidden: payload.deleted,
						});

					this.tableItems.push({key: key, value: payload.deleted});
				} else {
					// this.updateFromList(firstEl, key, tableName, payload.deleted);
				}
			}
		}
	}
}
