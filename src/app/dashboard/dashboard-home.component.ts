import { Component, OnInit } from '@angular/core';
import { User, UserService } from '@app-core/data/state/users';
import { BehaviorSubject } from 'rxjs';
import { Table } from '@app-core/data/state/tables';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { NbMenuItem } from '@nebular/theme';
import { KeyValue } from '@angular/common';
import { MENU_ITEMS } from '../pages/pages-menu';

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
	public menu: NbMenuItem[] = MENU_ITEMS;

	public date = new Date();

	public user$: BehaviorSubject<User> = null;

	public tableItems: KeyValue<string, boolean>[] = [];

	public handleDateChange(event) { }

	constructor(
		protected userService: UserService,
		protected firebaseService: FirebaseService,
	) {}

	public ngOnInit()
	{
		this.user$ = this.userService.getUser();
	}

	public onDataReceived(tableData: Table)
	{
		for(const [key, value] of Object.entries(tableData.data))
		{
			if (!this.firebaseService.getExcludedTables().includes(key))
			{
				const payload: any = value;

				let tableName = key;
				tableName = tableName.replace(/([A-Z])/g, ' $1').trim();
				tableName = tableName.charAt(0).toUpperCase() + tableName.substr(1);

				const firstEl: NbMenuItem = this.menu[0];

				if (!firstEl.children.find(child => child.title === tableName))
				{
					firstEl.children.push(
						{
							title: tableName,
							icon: 'chevron-right-outline',
							link: '/pages/game-db/' + key,
							hidden: payload.deleted,
						});

					this.tableItems.push({key: key, value: payload.deleted});
				} else {
					// this.updateFromList(firstEl, key, tableName, payload.deleted);
				}
			}
		}
	}
}
