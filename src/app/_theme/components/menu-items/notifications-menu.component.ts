import { Component, Input } from '@angular/core';
import {
	NbLayoutDirectionService,
	NbMenuComponent,
	NbMenuItemComponent,
	NbMenuService,
	NbToggleStates,
} from '@nebular/theme';
import { NgxMenuItem } from '@app-theme/components';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Router } from '@angular/router';

/**
 * @brief - Menu
 */
@Component({
	selector: '[ngxNotifyMenuItem]',
	templateUrl: './notification-menu-item.component.html',
	animations: [
		trigger('toggle', [
			state(NbToggleStates.Collapsed, style({height: '0', margin: '0'})),
			state(NbToggleStates.Expanded, style({height: '*'})),
			transition(`${NbToggleStates.Collapsed} <=> ${NbToggleStates.Expanded}`, animate(300)),
		]),
	],
})
export class NgxNotifyMenuItemComponent extends NbMenuItemComponent {
	@Input()
	menuItem: NgxMenuItem;

	constructor(
		protected menuService: NbMenuService,
		protected directionService: NbLayoutDirectionService,
		private router: Router,
	) {
		super(menuService, directionService);
	}

	public navigate(item: NgxMenuItem) {
		this.router.navigate([item.link],
			{
				queryParams: item.queryParams,
				fragment: item.fragment,
				skipLocationChange: item.skipLocationChange,
			}).then();
	}

	public onAcceptClicked(data: any) {
		if (this.menuItem.hasOwnProperty('onAccept')) this.menuItem.onAccept(data);
	}
}

@Component({
	selector: 'ngx-notifications-menu',
	styleUrls: ['./menu.component.scss'],
	template: `
		<ul class="menu-items">
			<ng-container *ngFor="let item of items">
				<li ngxNotifyMenuItem *ngIf="!item.hidden"
					[menuItem]="item"
					[class.menu-group]="item.group"
					(hoverItem)="onHoverItem($event)"
					(toggleSubMenu)="onToggleSubMenu($event)"
					(selectItem)="onSelectItem($event)"
					(itemClick)="onItemClick($event)"
					class="menu-item">
				</li>
			</ng-container>
		</ul>
	`,
})
export class NgxNotificationsMenuComponent extends NbMenuComponent {
	// public tag: string = 'sidebar-menu';

	@Input()
	items: NgxMenuItem[];
}
