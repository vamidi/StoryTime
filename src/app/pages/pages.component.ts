import { Component, OnDestroy, OnInit } from '@angular/core';
import { KeyValue } from '@angular/common';

import { MENU_ITEMS } from './pages-menu';
import { NbMenuItem, NbMenuService } from '@nebular/theme';
import { filter } from 'rxjs/operators';
import { NbMenuBag } from '@nebular/theme/components/menu/menu.service';
import { UserPreferences } from '@app-core/utils/utils.service';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { NbIconConfig } from '@nebular/theme/components/icon/icon.component';
import { Subscription } from 'rxjs';

@Component({
	selector: 'ngx-pages',
	styleUrls: ['pages.component.scss'],
	template: `
<!--		<router-outlet></router-outlet>-->
		<ngx-one-column-layout>
			<nb-menu [items]="rootMenu" tag="menu-sidebar"></nb-menu>
			<router-outlet></router-outlet>
		</ngx-one-column-layout>
	`,
})
export class PagesComponent implements OnInit, OnDestroy
{
	public rootMenu: NbMenuItem[] = MENU_ITEMS;

	public recentUsedItems: { title: string, icon?: string | NbIconConfig, link?: string }[] = [];

	public tableItems: KeyValue<string, boolean>[] = [];

	protected userPreferences: UserPreferences = null;

	protected mainSubscription: Subscription = new Subscription();

	constructor(
		private nbMenuService: NbMenuService,
		private userPreferencesService: UserPreferencesService) { }

	public ngOnInit()
	{
		this.nbMenuService.onItemClick()
			.pipe(
				filter(({ tag }) => tag === 'root-menu'),
			)
			.subscribe(( menuBag ) => this.handleRecentItems(menuBag));

		this.mainSubscription.add(this.userPreferencesService.getUserPreferences().subscribe((userPreferences) => {
			this.userPreferences = { ...userPreferences };
			this.recentUsedItems = this.userPreferences?.recentUsedMenuItems ?? [];
			this.rootMenu[0].children = this.recentUsedItems;
		}));
	}

	public ngOnDestroy(): void
	{
		if(!this.mainSubscription.closed)
			this.mainSubscription.unsubscribe();

		const secondEl: NbMenuItem = this.rootMenu[1];
		if(secondEl)
			secondEl.children = [];
	}

	private handleRecentItems(menuBag: NbMenuBag)
	{
		const len = this.recentUsedItems.length;
		// TODO change to user preferences
		if(len > 4)
		{
			// remove first item of the array
			this.recentUsedItems.shift();
		}

		const found = this.recentUsedItems.find((m) => m.title === menuBag.item.title);
		if(!found || this.recentUsedItems.length === 0)
		{
			// const menuItem: { title: string, icon?: string | NbIconConfig, link?: string } = {
			// 	title: menuBag.item.title,
			// 	icon: menuBag.item.icon,
			// 	link: menuBag.item.link,
			// };

			// console.log(menuBag.item);
			// return;
			this.recentUsedItems.push(menuBag.item);
			this.rootMenu[0].children = this.recentUsedItems;

			this.userPreferences.recentUsedMenuItems = this.recentUsedItems;
			this.userPreferencesService.setUserPreferences(this.userPreferences);
		}
	}
}
