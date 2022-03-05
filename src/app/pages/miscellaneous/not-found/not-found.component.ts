import { Component } from '@angular/core';
import { Router } from '@angular/router';
// import { NbMenuService } from '@nebular/theme';

@Component({
	selector: 'ngx-not-found',
	styleUrls: ['./not-found.component.scss'],
	templateUrl: './not-found.component.html',
})
export class NotFoundComponent
{

	constructor(
		private route: Router,
		// private menuService: NbMenuService
	)
	{
	}

	async goToHome()
	{
		return this.route.navigate(['dashboard']);
		// TODO figure out why this is not working.
		// this.menuService.navigateHome();
	}
}
