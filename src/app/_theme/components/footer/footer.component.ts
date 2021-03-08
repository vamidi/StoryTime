import { Component } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Component({
	selector: 'ngx-footer',
	styleUrls: ['./footer.component.scss'],
	template: `
        <span class="created-by"> {{ appTitle }}
	    	Ver. {{ appVersion }}
			<b>Created by Valencio Hoffman </b> Based on  <a href="https://akveo.com" target="_blank">Akveo</a> 2019-2020
		</span>
        <div class="socials">
            <a href="#" target="_blank" class="ion ion-social-github"></a>
            <a href="#" target="_blank" class="ion ion-social-facebook"></a>
            <a href="#" target="_blank" class="ion ion-social-twitter"></a>
            <a href="#" target="_blank" class="ion ion-social-linkedin"></a>
        </div>
	`,
})
export class FooterComponent
{
	public appTitle: string = environment.title;
	public appVersion: string = environment.appVersion;
}
