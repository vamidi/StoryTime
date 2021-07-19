import { Component } from '@angular/core';
import { NbMenuService } from '@nebular/theme';

@Component({
	selector: 'ngx-no-permissions',
	styleUrls: ['no-permissions.component.scss'],
	templateUrl: 'no-permissions.component.html',
})
export class NoPermissionComponent
{

	constructor(private menuService: NbMenuService)
	{
	}

	goToHome()
	{
		this.menuService.navigateHome();
	}
}
