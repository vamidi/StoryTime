import { Component, Inject, OnInit } from '@angular/core';
import { NB_AUTH_OPTIONS, NbAuthResult, NbAuthService, NbLogoutComponent } from '@nebular/auth';
import { Router } from '@angular/router';

@Component({
	selector: 'ngx-logout',
	template: '<div>Logging out, please wait...</div>',
})
export class NgxFirebaseLogoutComponent extends NbLogoutComponent implements OnInit
{
	public constructor(
		protected service: NbAuthService,
		@Inject(NB_AUTH_OPTIONS) protected options = {},
		protected router: Router)
	{
		super(service, options, router);
	}

	public ngOnInit(): void
	{
		super.ngOnInit();
	}

	public async logout(strategy: string): Promise<void>
	{
		this.service.logout(strategy).subscribe((result: NbAuthResult) =>
		{
			// super.logout(strategy);
			localStorage.removeItem('user');
			localStorage.removeItem('expires_at');

			const redirect = result.getRedirect();
			if (redirect) {
				setTimeout(() => {
					return this.router.navigateByUrl(redirect);
				}, this.redirectDelay);
			}
			else
				return this.router.navigateByUrl(this.getConfigValue('logout.redirect.success'));
		});
	}
}
