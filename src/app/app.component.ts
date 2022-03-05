/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { AfterViewInit, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { NbMenuItem, NbSpinnerService } from '@nebular/theme';
import { MENU_ITEMS } from './pages/pages-menu';
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


	// Main subscription to all events
	protected mainSubscription: Subscription = new Subscription();
	protected userPreferences: UserPreferences = null;

	constructor(
		protected electronService: ElectronService,
		protected userPreferencesService: UserPreferencesService,
		private spinnerService: NbSpinnerService,
	) { }

	ngOnInit(): void
	{
		// this.spinnerService.registerLoader(this._loadData());
		// get the quests
		// get the main table reference
		this.spinnerService.load();

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
}
