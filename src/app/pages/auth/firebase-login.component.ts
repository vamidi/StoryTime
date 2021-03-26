import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { NB_AUTH_OPTIONS, NbAuthResult, NbAuthService, NbLoginComponent } from '@nebular/auth';
import { NbAuthSocialLink } from '@nebular/auth/auth.options';
import { NbThemeService } from '@nebular/theme';

import { Store } from '@ngxs/store';

import * as firebase from 'firebase/app';
import 'firebase/auth';
import Persistence = firebase.auth.Auth.Persistence;

import { UtilsService } from '@app-core/utils';
import { FirebaseService } from '@app-core/utils/firebase.service';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';

import { UserService, GetUser } from '@app-core/data/state/users';
import { environment } from '../../../environments/environment';

interface AuthSocialLink extends NbAuthSocialLink
{
	method?: string;
}

@Component({
	selector: 'ngx-login',
	templateUrl: './login.component.html',
})
export class NgxFirebaseLoginComponent extends NbLoginComponent implements OnInit
{
	socialLinks: AuthSocialLink[] = [];

	showPassword = false;

	private returnUrl: string = '';

	// user$: Observable<UserModel> = this.userService.user$;

	constructor(
		@Inject(NB_AUTH_OPTIONS) options:{},
		public router: Router,
		protected service: NbAuthService,
		protected themeService: NbThemeService,
		protected userService: UserService,
		protected userPreferencesService: UserPreferencesService,
		protected firebaseService: FirebaseService,
		private store: Store,
		protected cd: ChangeDetectorRef,
		private route: ActivatedRoute)
	{
		super(service, options, cd, router);
		// TODO only if we really want to add google login
		// const link: AuthSocialLink = {
		// 	method: 'google', link: '', url: '', target: '_blank', title: '', icon: 'google',
		// };

		// this.socialLinks.push(link);
	}

	public async ngOnInit(): Promise<void>
	{
		const userPreferences = await this.userPreferencesService.getUserPreferences().toPromise();
		this.themeService.changeTheme(userPreferences.currentTheme);

		// get return url from route parameters or default to '/'
		this.returnUrl = this.route.snapshot.queryParams.returnUrl ?? '';
	}

	public handleLogin(method: string)
	{
		switch(method)
		{
			case 'google':
			default:
				this.service.authenticate(this.strategy, { method })
		}
	}

	public getInputType() {
		if (this.showPassword) {
			return 'text';
		}
		return 'password';
	}

	public toggleShowPassword()
	{
		this.showPassword = !this.showPassword;
	}

	public async login()
	{
		if(this.user.rememberMe)
			await this.userService.setPersistence(Persistence.LOCAL);
		else
			await this.userService.setPersistence(Persistence.SESSION);

		this.service.authenticate(this.strategy, this.user).subscribe((result: NbAuthResult) =>
		{
			this.submitted = false;

			if (result.isSuccess())
			{
				const res = result.getResponse();

				if(res.hasOwnProperty('user')) {
					localStorage.setItem('user', JSON.stringify(res.user));
				}
				// expire after 3600 seconds (1 hour)
				if(result.getToken() && result.getToken().getPayload())
					UtilsService.setItemInLocalStorage('expire_at', result.getToken().getPayload().exp);

				this.messages = result.getMessages();

				const redirect = this.returnUrl !== '' ? this.returnUrl : result.getRedirect();
				setTimeout(() => {
					if(environment.redux) this.store.dispatch(new GetUser());
					return this.router.navigateByUrl(redirect);
				}, this.redirectDelay);



			} else {
				this.errors = result.getErrors();
			}

			this.cd.detectChanges();
		});
	}
}
