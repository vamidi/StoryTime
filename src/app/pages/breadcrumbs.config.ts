interface IRoute
{
	route: string
}

interface IRouteName extends IRoute
{
	name: string,
}

interface IRouteCallback extends IRoute
{
	callback: (id: string) => string;
}

interface Config
{
	prefix: string,
	names: IRouteName[],
	regexNames: IRouteName[],
	hide: IRoute[],
	regexHide: IRoute[],
	noBreadcrumbs: IRoute[],
	regexNoBreadcrumbs: IRoute[],
	nameCallbacks: IRouteCallback[],
	regexNameCallbacks: IRouteCallback[],
}


export const breadcrumbsConfig: Config = {

	// The Home link in breadcrumbs
	prefix: 'Home',

	// Replace route name with a friendly name
	names: [
		/**
		 * Regex for UUID: [0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}
		 * @param { BreadcrumbsService } breadcrumbService
		 */
		{ route: '/dashboard', name: 'Dashboard' },
		{ route: '/dashboard/projects', name: 'Projects' },
	],

	// Replace route regular expression with a friendly name
	regexNames: [
		// {route: '', name: ''},
	],

	// Hide route from breadcrumbs trail
	hide: [
		{ route: '/pages' },
	],

	// Hide route regular expression from breadcrumbs trail
	regexHide: [
		{ route: `/dashboard/projects/-[a-zA-Z]/tables` },
	],

	// Remove the breadcrumbs component on these routes
	noBreadcrumbs: [
		{ route: '/pages/dashboard' },
	],

	// Remove the breadcrumbs component on these routes regular expression
	regexNoBreadcrumbs: [
		// {route: ''},
	],

	nameCallbacks: [],

	regexNameCallbacks: [],
};
