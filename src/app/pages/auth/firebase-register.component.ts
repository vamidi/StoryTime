/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { getDeepFromObject, NB_AUTH_OPTIONS, NbAuthResult, NbAuthService, NbAuthSocialLink } from '@nebular/auth';
import { FirebaseService } from '@app-core/utils/firebase.service';
import { User } from '@app-core/data/users';
import { UtilsService } from '@app-core/utils';
import { NbToastrService } from '@nebular/theme';
import { UserService } from '@app-core/data/users.service';

@Component({
	selector: 'nb-register',
	styleUrls: ['../../../../node_modules/@nebular/auth/components/register/register.component.scss'],
	templateUrl: '../../../../node_modules/@nebular/auth/components/register/register.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxFirebaseRegisterComponent {

	redirectDelay: number = 0;
	showMessages: any = {};
	strategy: string = '';

	submitted = false;
	errors: string[] = [];
	messages: string[] = [];
	user: any = {};
	socialLinks: NbAuthSocialLink[] = [];

	constructor(protected service: NbAuthService,
				protected toastrService: NbToastrService,
				protected userService: UserService,
				@Inject(NB_AUTH_OPTIONS) protected options = {},
				protected cd: ChangeDetectorRef,
				protected router: Router,
				protected firebaseService: FirebaseService)
	{
		this.redirectDelay = this.getConfigValue('forms.register.redirectDelay');
		this.showMessages = this.getConfigValue('forms.register.showMessages');
		this.strategy = this.getConfigValue('forms.register.strategy');
		this.socialLinks = this.getConfigValue('forms.login.socialLinks');
	}

	public register(): void
	{
		this.errors = this.messages = [];
		this.submitted = true;

		this.service.register(this.strategy, this.user).subscribe((result: NbAuthResult) => {
			this.submitted = false;
			if (result.isSuccess())
			{
				// based on successful register
				if(result.getResponse().user)
				{
					const user = result.getResponse().user;
					const split = this.user.fullName.split(' ', 2);

					const newUser: User =
					{
						uid: user.uid,
						projects: {},
						metadata: {
							displayName: this.user.fullName,
							email: user.email,
							firstName: split[0] ?? '',
							lastName: split[1] ?? '',
							photoURL: '',
							created_at: UtilsService.timestamp,
							updated_at: UtilsService.timestamp,
						},
					};

					this.firebaseService.insertItem(user.uid, newUser, 'users').then(() => {
						UtilsService.showToast(
							this.toastrService,
							'User info updated!',
							'User successfully created',
						)
					});

					// also update user info
					this.userService.updateUserInfo(newUser);
				}

				this.messages = result.getMessages();
			} else {
				this.errors = result.getErrors();
			}

			const redirect = result.getRedirect();
			if (redirect) {
				setTimeout(() => {
					return this.router.navigateByUrl(redirect);
				}, this.redirectDelay);
			}
			this.cd.detectChanges();
		});
	}

	getConfigValue(key: string): any
	{
		return getDeepFromObject(this.options, key, null);
	}
}
