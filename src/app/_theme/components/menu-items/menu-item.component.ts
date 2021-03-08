import { Component, EventEmitter, Output } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import {
	NbMenuComponent,
	NbMenuItem,
	NbMenuItemComponent, NbMenuService,
	NbToggleStates,
	NbLayoutDirectionService,
} from '@nebular/theme';
import { NbIconConfig } from '@nebular/theme/components/icon/icon.component';
import { Router } from '@angular/router';

/**
 * @brief - override of the NbMenuItem class
 * This is to support favorite and icon suffix click
 */
export class NgxMenuItem extends NbMenuItem
{
	/**
	 * @brief - Is this an item that can be favored
	 * @type {boolean}
	 */
	canFavorite?: boolean = false;

	/**
	 * Is this item set to favorite
	 * @type {boolean}
	 */
	isFavorite?: boolean = false;

	/**
	 * Children items
	 * @type {List<NbMenuItem>}
	 */
	children?: NgxMenuItem[];

	/**
	 * @type {string|NbIconConfig}
	 */
	iconSuffix?: string | NbIconConfig;

	onIconSuffixClick?: Function;

	/**
	 * This is for notifications
	 */
	isPending?: boolean = false;

	isRead?: boolean = false;

	onAccept?: Function;
	onDeclined?: Function
}

/**
 * @brief - Menu
 */
@Component({
	selector: '[ngxMenuItem]',
	templateUrl: './menu-item.component.html',
	animations: [
		trigger('toggle', [
			state(NbToggleStates.Collapsed, style({ height: '0', margin: '0' })),
			state(NbToggleStates.Expanded, style({ height: '*' })),
			transition(`${NbToggleStates.Collapsed} <=> ${NbToggleStates.Expanded}`, animate(300)),
		]),
	],
})
export class NgxMenuItemComponent extends NbMenuItemComponent
{
	menuItem: NgxMenuItem;

	@Output()
	favoriteClick = new EventEmitter<any>();

	constructor(
		protected menuService: NbMenuService,
		protected directionService: NbLayoutDirectionService,
		private router: Router,
	) {
		super(menuService, directionService);
	}

	public onFavoriteClick(item: NgxMenuItem) {
		this.favoriteClick.emit(item);
	}

	public navigate(item: NgxMenuItem)
	{
		this.router.navigate([item.link],
			{ queryParams: item.queryParams, fragment: item.fragment, skipLocationChange: item.skipLocationChange }).then();
	}
}

@Component({
	selector: 'ngx-menu',
	styleUrls: ['./menu.component.scss'],
	template: `
    <ul class="menu-items">
      <ng-container *ngFor="let item of items">
        <li ngxMenuItem *ngIf="!item.hidden"
            [menuItem]="item"
            [class.menu-group]="item.group"
            (hoverItem)="onHoverItem($event)"
            (toggleSubMenu)="onToggleSubMenu($event)"
            (selectItem)="onSelectItem($event)"
            (itemClick)="onItemClick($event)"
			(favoriteClick)="onFavoriteClick($event);"
			class="menu-item">
        </li>
      </ng-container>
    </ul>
  `,
})
export class NgxMenuComponent extends NbMenuComponent
{
	// public tag: string = 'sidebar-menu';

	items: NgxMenuItem[];

	public onFavoriteClick(item: NgxMenuItem) {
		console.log(item.title);
	}
}
