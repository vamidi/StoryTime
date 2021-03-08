import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

import { BreadcrumbsService } from '@app-core/utils';
import { breadcrumbsConfig } from '../../../pages/breadcrumbs.config';
import { Breadcrumb } from '@app-core/utils/breadcrumbs.service';
import { Subscription } from 'rxjs';
import { NbMenuItem } from '@nebular/theme/components/menu/menu.service';

@Component({
	selector: 'ngx-breadcrumbs',
	templateUrl: 'breadcrumbs.component.html',
	styleUrls: ['./breadcrumbs.component.scss'],
})
export class BreadcrumbsComponent implements OnInit, OnChanges, OnDestroy
{
	/**
	 * @brief - Prefix for all the urls
	 */
	@Input()
	public prefix: string = breadcrumbsConfig.prefix;

	public isHidden = false;
	public _urls: string[] = [];
	public _routerSubscription: Subscription;

	constructor(
		private router: Router,
		private breadcrumbService: BreadcrumbsService,
	) { }

	ngOnInit(): void
	{
		if (this.prefix.length > 0) {
			this._urls.unshift(this.prefix);
		}

		this._routerSubscription = this.router.events.subscribe((navigationEnd: NavigationEnd) => {

			if (navigationEnd instanceof NavigationEnd) {
				this._urls.length = 0; // Fastest way to clear out array
				this.generateBreadcrumbTrail(navigationEnd.urlAfterRedirects ? navigationEnd.urlAfterRedirects : navigationEnd.url);

				this.hideIfNoBreadcrumbs();
			}
		});

		breadcrumbsConfig.names.forEach((item) => {
			this.breadcrumbService.addFriendlyNameForRoute(item.route, item.name);
		});
		breadcrumbsConfig.regexNames.forEach((item) => {
			this.breadcrumbService.addFriendlyNameForRouteRegex(item.route, item.name);
		});
		breadcrumbsConfig.hide.forEach((item) => {
			this.breadcrumbService.hideRoute(item.route);
		});
		breadcrumbsConfig.regexHide.forEach((item) => {
			this.breadcrumbService.hideRouteRegex(item.route);
		});
		breadcrumbsConfig.noBreadcrumbs.forEach((item) => {
			this.breadcrumbService.removeBreadcrumbsRoute(item.route);
		});
		breadcrumbsConfig.regexNoBreadcrumbs.forEach((item) => {
			this.breadcrumbService.removeBreadcrumbsRouteRegex(item.route);
		});

		this._urls.length = 0;
		this.generateBreadcrumbTrail(this.router.url);

		this.hideIfNoBreadcrumbs();

		this.breadcrumbService.registerComponent(this);
	}

	ngOnChanges(changes: any): void {
		if (!this._urls) {
			return;
		}

		this._urls.length = 0;
		this.generateBreadcrumbTrail(this.router.url);
	}

	generateBreadcrumbTrail(url: string): void
	{
		if (!this.breadcrumbService.isRouteHidden(url))
		{
			// Add url to beginning of array (since the url is being recursively broken down from full url to its parent)
			this._urls.unshift(url);
		}

		if (url.lastIndexOf('/') > 0)
		{
			// Find last '/' and add everything before it as a parent route
			this.generateBreadcrumbTrail(url.substr(0, url.lastIndexOf('/')));
		} else if (this.prefix.length > 0) {
			this._urls.unshift(this.prefix);
		}
	}

	navigateTo(url: string, then?:() => {}): void
	{
		this.router.navigateByUrl(url).then(then);
	}

	isDropdown(url: string): boolean {
		const links = this.breadcrumbService.getDropdownForRoute(url);
		return links !== null;
	}

	dropdownRoute(url: string): NbMenuItem[] {
		return this.breadcrumbService.getDropdownForRoute(url);
	}

	friendlyName(url: string): string {
		return !url ? '' : this.breadcrumbService.getFriendlyNameForRoute(url);
	}

	ngOnDestroy(): void {
		this.breadcrumbService.removeComponent(this);
		this._routerSubscription.unsubscribe();
	}

	private hideIfNoBreadcrumbs() {
		if (this.breadcrumbService.breadcrumbsRemoved(this.router.url)) {
			this.isHidden = true;
		} else {
			this.isHidden = false;
		}
	}

}
