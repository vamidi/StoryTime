/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { AfterViewInit, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { KeyValue } from '@angular/common';
import { NbMenuItem, NbSpinnerService } from '@nebular/theme';
import { MENU_ITEMS } from './pages/pages-menu';
import { FirebaseService } from '@app-core/utils/firebase.service';
import { BreadcrumbsService, UtilsService } from '@app-core/utils';
import { Table } from '@app-core/data/table';

@Component({
	selector: 'ngx-app',
	template: '<router-outlet></router-outlet>',
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy
{
	menu: NbMenuItem[] = MENU_ITEMS;

	public tableItems: KeyValue<string, boolean>[] = [];

	constructor(
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
	}

	public ngAfterViewInit()
	{
	}

	public ngOnDestroy() {
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

				// if(typeof payload === 'boolean')
				// {
				// this.DeletedTittle = (payload) ? 'This table is deleted' : '';
				// this.isDeleted = payload;
				// }
			}
		}
	}
}
