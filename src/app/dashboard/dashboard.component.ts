import { Component, ViewChild } from '@angular/core';
import { MENU_ITEMS } from '../pages/pages-menu';
import { FirebaseService } from '@app-core/utils/firebase.service';
import { BreadcrumbsService } from '@app-core/utils';
import { NgxMenuItem } from '@app-theme/components';
import { OneColumnLayoutComponent } from '@app-theme/layouts';

/**
 * @brief - Front page of the dashboard
 *
 */
@Component({
	selector: 'ngx-dashboard',
	template: `
		<ngx-one-column-layout #oneColumnLayoutComponent [menu]="menu">
			<ngx-menu [items]="menu"></ngx-menu>
			<router-outlet (activate)="onRouterOutletActivate($event)"></router-outlet>
		</ngx-one-column-layout>
	` ,
})
export class DashboardComponent
{
	public menu: NgxMenuItem[] = MENU_ITEMS;

	@ViewChild('oneColumnLayoutComponent', { static: true })
	public oneColumnLayoutComponent: OneColumnLayoutComponent = null;

	public constructor(
		protected firebaseService: FirebaseService,
	) {}

	public onRouterOutletActivate(event: Component) {
		if(this.oneColumnLayoutComponent)
			this.oneColumnLayoutComponent.onRouterOutletActivate(event);
	}
}
