import { Component } from '@angular/core';
import { environment } from '../../environments/environment';
import { Table } from '@app-core/data/state/tables';

@Component({
	selector: 'ngx-home',
	template: `
		<router-outlet #myOutlet="outlet"></router-outlet>
		<div [hidden]="myOutlet.isActivated">
			<nb-card>
				<nb-card-header>
					<h3>Ver. {{ appVersion }} The backpacker's first obstacle</h3>
					<h6>Buas Management Dashboard</h6>
				</nb-card-header>
				<nb-card-body>
					<h5>Introduction</h5>
					<p>
						Welcome to the web interface of the management team. we are proud to announce our system that uses [Firebase](https://firebase.google.com/docs/database "Firebase") as a NoSQL database. NoSQL lets you adjust data in real-time.
					</p>
					<p>
					</p>
					<h5>How to use</h5>
					<a href="/dashboard">Go to dashboard</a>
				</nb-card-body>
				<!--				<nb-card-footer></nb-card-footer>-->
			</nb-card>
		</div>
	`,
})
export class HomeComponent
{
	public appVersion: string = environment.appVersion;
}
