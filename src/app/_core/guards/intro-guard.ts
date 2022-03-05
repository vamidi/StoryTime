import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { UserPreferencesService } from '../utils/user-preferences.service';
import { UserPreferences } from '../utils/utils.service';


@Injectable({ providedIn: 'any' })
export class IntroGuard implements CanActivate
{
	protected userPreferences: UserPreferences = null;
	protected mainSubscription = new Subscription();

	constructor(
		protected userPreferencesService: UserPreferencesService,
		private route: Router,
	) {
		console.log('jere');
		this.mainSubscription.add(this.userPreferencesService.getUserPreferences().subscribe((userPreferences) => {
			this.userPreferences = { ...userPreferences };
		}));
	}

	public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
		const introSet = this.userPreferences.introSet ?? false;

		// if we are not on the intro page see if we have set the intro
		if(!introSet)
		{
			console.log(state.url === '/intro');
			// if we are not already on the intro page
			if(state.url !== '/intro')
				this.route.navigate(['intro']);
			else
				return of(true);

			return of(false);
		}

		if(state.url === '/intro')
			this.route.navigate(['auth/login']);

		// if everything is set then see if we are logged in or not.
		return of(true);
	}
}
