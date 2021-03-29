import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NbMenuItem } from '@nebular/theme/components/menu/menu.service';

@Injectable()
export class BreadcrumbsService
{
	private routesFriendlyNames: Map<string, string> = new Map<string, string>();
	private routesFriendlyNamesRegex: Map<string, string> = new Map<string, string>();
	private routesWithCallback: Map<string, (string: string) => string> = new Map<string, (string: string) => string>();
	private routesWithCallbackRegex: Map<string, (string: string)
		=> string> = new Map<string, (string: string) => string>();
	private routesWithDropDown: Map<string, Array<NbMenuItem>> = new Map<string, Array<NbMenuItem>>();
	private routesWithDropDownRegex: Map<string, Array<NbMenuItem>> = new Map<string, Array<NbMenuItem>>();
	private hideRoutes: any = new Array<string>();
	private hideRoutesRegex: any = new Array<string>();
	private noBreadcrumbsRoutes: any = new Array<string>();
	private noBreadcrumbsRoutesRegex: any = new Array<string>();

	private breadComponents: any[] = [];

	constructor(private router: Router) { }

	/**
	 *
	 */
	public registerComponent(breadComponent: any): void
	{
		this.breadComponents.push(breadComponent);
	}

	public removeComponent(breadComponent: any): void
	{
		const idx = this.breadComponents.indexOf(breadComponent);
		if(idx !== -1) this.breadComponents.splice(idx, 1);
	}

	public regenerateBreadcrumbTrail(): void
	{
		this.breadComponents.forEach(value =>
		{
			value._urls.length = 0;
			value.generateBreadcrumbTrail(this.router.url)
		});
	}

	/**
	 * Specify a friendly name for the corresponding route.
	 *
	 * @param route
	 * @param name
	 */
	public addFriendlyNameForRoute(route: string, name: string): void {
		this.routesFriendlyNames.set(route, name);
	}

	/**
	 * Specify a friendly name for the corresponding route matching a regular expression.
	 *
	 * @param routeRegex
	 * @param name
	 */
	public addFriendlyNameForRouteRegex(routeRegex: string, name: string): void
	{
		this.routesFriendlyNamesRegex.set(routeRegex, name);
	}

	/**
	 * Specify a callback for the corresponding route.
	 * When a matching url is navigated to, the callback function is
	 * invoked to get the name to be displayed in the breadcrumb.
	 */
	public addCallbackForRoute(route: string, callback: (id: string) => string): void {
		this.routesWithCallback.set(route, callback);
	}

	/**
	 * Specify a callback for the corresponding route matching a regular expression.
	 * When a matching url is navigated to, the callback function is
	 * invoked to get the name to be displayed in the breadcrumb.
	 */
	public addCallbackForRouteRegex(routeRegex: string, callback: (id: string) => string): void {
		this.routesWithCallbackRegex.set(routeRegex, callback);
	}

	/**
	 *
	 * @param route
	 * @param links
	 */
	public addDropdownForRoute(route: string, links: Array<NbMenuItem>): void {
		this.routesWithDropDown.set(route, links);
	}

	/**
	 *
	 * @param routeRegex
	 * @param links
	 */
	public addDropdownForRouteRegex(routeRegex: string, links: Array<NbMenuItem>): void {
		this.routesWithDropDownRegex.set(routeRegex, links);
	}

	/**
	 * @brief -
	 * @param route
	 */
	public getDropdownForRoute(route: string): NbMenuItem[] | null
	{
		let links: NbMenuItem[] = null;
		this.routesWithDropDown.forEach(( value, key) =>
		{
			if (key === route)
			{
				links = value;
			}
		});

		this.routesWithDropDownRegex.forEach(( value, key) =>
		{
			if (new RegExp(key).exec(route))
			{
				links = value;
			}
		});

		return links;
	}

	/**
	 * Show the friendly name for a given route (url). If no match is found the url (without the leading '/') is shown.
	 *
	 * @param route
	 * @returns {*}
	 */
	public getFriendlyNameForRoute(route: string): string
	{
		let name: string;
		const routeEnd = route.substr(route.lastIndexOf('/') + 1, route.length);

		this.routesWithCallback.forEach((value, key) => {
			if (key === route) {
				name = value(routeEnd);
			}
		});

		this.routesWithCallbackRegex.forEach((value, key) => {
			if (new RegExp(key).exec(route))
			{
				name = value(routeEnd);
			}
		});

		this.routesFriendlyNames.forEach((value, key) => {
			if (key === route) {
				name = value;
			}
		});

		this.routesFriendlyNamesRegex.forEach((value, key) =>
		{
			if (new RegExp(key).exec(route))
			{
				name = value;
			}
		});

		return name ? name : routeEnd;
	}

	/**
	 * Specify a route (url) that should not be shown in the breadcrumb.
	 */
	public hideRoute(route: string): void {
		if (this.hideRoutes.indexOf(route) === -1) {
			this.hideRoutes.push(route);
		}
	}

	/**
	 * Specify a route (url) regular expression that should not be shown in the breadcrumb.
	 */
	public hideRouteRegex(routeRegex: string): void {
		if (this.hideRoutesRegex.indexOf(routeRegex) === -1) {
			this.hideRoutesRegex.push(routeRegex);
		}
	}

	/**
	 * Returns true if a route should be hidden.
	 */
	public isRouteHidden(route: string): boolean
	{
		let hide = this.hideRoutes.indexOf(route) > -1;

		this.hideRoutesRegex.forEach((value: any) =>
		{
			if (new RegExp(value).exec(route)) {
				hide = true;
			}
		});

		return hide;
	}

	/**
	 * Specify a route (url) that should not show the breadcrumbs component.
	 */
	public removeBreadcrumbsRoute(route: string): void
	{
		if (this.noBreadcrumbsRoutes.indexOf(route) === -1) {
			this.noBreadcrumbsRoutes.push(route);
		}
	}

	/**
	 * Specify a route (url) regular expression that should not show the breadcrumbs component.
	 */
	public removeBreadcrumbsRouteRegex(routeRegex: string): void
	{
		if (this.noBreadcrumbsRoutesRegex.indexOf(routeRegex) === -1) {
			this.noBreadcrumbsRoutesRegex.push(routeRegex);
		}
	}

	/**
	 * Returns true if a route should not show the breadcrumbs component.
	 */
	public breadcrumbsRemoved(route: string): boolean
	{
		let remove = this.noBreadcrumbsRoutes.indexOf(route) > -1;

		this.noBreadcrumbsRoutesRegex.forEach((value: any) => {
			if (new RegExp(value).exec(route)) {
				remove = true;
			}
		});

		return remove;
	}

}
