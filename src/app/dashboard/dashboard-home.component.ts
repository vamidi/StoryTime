import { Component, OnInit } from '@angular/core';
import { User, UserService } from '@app-core/data/state/users';
import { BehaviorSubject } from 'rxjs';
import { ElectronService } from '@app-core/utils/electron.service';

@Component({
	selector: 'ngx-home',
	template: `
		<router-outlet #myOutlet="outlet"></router-outlet>
		<div [hidden]="myOutlet.isActivated" class="row">
			<!-- Introduction -->
			<div class="col col-lg-4">
				<nb-card>
					<nb-card-header>
						<h3 *ngIf="(user$ | async) as user">Welcome back {{ user.metadata.displayName }}</h3>
						<h6>StoryTime</h6>
					</nb-card-header>
					<nb-card-body>
						<h5>Introduction</h5>
						<p>
							Welcome to the dashboard of StoryTime. we are proud to announce our system that uses [Firebase](https://firebase.google.com/docs/database "Firebase") as a NoSQL database. NoSQL lets you adjust data in real-time.
						</p>
						<p>
						</p>
						<h5>How to use</h5>
					</nb-card-body>
				</nb-card>
			</div>

			<!-- Ongoing projects -->
			<div class="col col-lg-4">
				<nb-card>
					<nb-card-header>
						<h3>Ongoing Projects</h3>
					</nb-card-header>
					<nb-card-body>
						<h5>Introduction</h5>
						<p>
							Welcome to the dashboard of StoryTime. we are proud to announce our system that uses [Firebase](https://firebase.google.com/docs/database "Firebase") as a NoSQL database. NoSQL lets you adjust data in real-time.
						</p>
						<p>
						</p>
						<h5>How to use</h5>
					</nb-card-body>
				</nb-card>
			</div>

			<div class="col col-lg-4">
				<nb-calendar class="w-100" [date]="date" (dateChange)="handleDateChange($event)"></nb-calendar>
			</div>
		</div>
	`,
	styleUrls: ['./dashboard.component.scss'],
})
export class DashboardHomeComponent implements OnInit
{
	public date = new Date();

	public user$: BehaviorSubject<User> = null;

	public handleDateChange(event) { }

	constructor(
		protected userService: UserService,
		protected electronService: ElectronService,
	) {}

	public ngOnInit()
	{
		this.user$ = this.userService.getUser();

		if(this.electronService.isElectron)
			console.log(process.env.FIREBASE_API_KEY);
	}
}
