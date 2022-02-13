import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireAuthGuard, AuthPipeGenerator, loggedIn } from '@angular/fire/auth-guard';
import { Subscription, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { UserPreferencesService } from '../utils/user-preferences.service';
import { UserPreferences } from '../utils/utils.service';


@Injectable({ providedIn: 'any' })
export class AuthGuard extends AngularFireAuthGuard implements CanActivate
{
	protected userPreferences: UserPreferences = null;
	protected mainSubscription = new Subscription();

	constructor(
		protected userPreferencesService: UserPreferencesService,
		private route: Router,
		private nbAuth: AngularFireAuth,
	) {
		super(route, nbAuth);

		this.mainSubscription.add(this.userPreferencesService.getUserPreferences().subscribe((userPreferences) => {
			this.userPreferences = { ...userPreferences };
		}));
	}

	canActivate = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
		console.log(this.userPreferences, next, state);

		// if we are not on the intro page see if we have set the intro
		if(!this.userPreferences.introSet)
		{
			// if we are not already on the intro page
			if(state.url !== '/intro')
				this.route.navigate(['intro']);

			return of(true);
		}

		// if everything is set then see if we are logged in or not.
		const authPipeFactory = next.data.authGuardPipe as AuthPipeGenerator || (() => loggedIn);
		return this.nbAuth.user.pipe(
			take(1),
			authPipeFactory(next, state),
			map(can => {
				if (typeof can === 'boolean') {
					return can;
				} else if (Array.isArray(can)) {
					return this.route.createUrlTree(can);
				} else {
					return this.route.parseUrl(can);
				}
			}),
		);
	}
}
