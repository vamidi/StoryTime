import { Component, Input, OnInit } from '@angular/core';
import {
	NbDialogRef,
	NbMenuComponent,
} from '@nebular/theme';
import { IDialog } from '@app-theme/components/firebase-table';
import { environment } from '../../../../environments/environment';
import { delay, map } from 'rxjs/operators';
import { NewsPost } from '../../../pages/layout/news.service';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

interface IVersionLog
{
	title: string,
	group?: boolean,
	hidden?: boolean,
	highlight?: boolean,
	children?: IVersionLog[],
}

@Component({
	selector: '[ngxVersionMenu]',
	template: `
		{{ menuItem.title }}
		<ul *ngIf="menuItem.children" class="menu-items">
			<ng-container *ngFor="let item of menuItem.children">
				<li ngxVersionMenu *ngIf="!item.hidden"
					[menuItem]="item"
					[class.menu-group]="item.group"
					[class.font-weight-bold]="item.highlight"
					class="menu-item font-weight-bold">
				</li>
			</ng-container>
		</ul>
	`,
})
export class NgxVersionMenuComponent
{
	@Input()
	menuItem: IVersionLog = <IVersionLog>null;
}

@Component({
	selector: 'ngx-changelog-menu',
	template: `
		<span *ngFor="let version of items">
			<h5>{{ version.title }}</h5>
			<ul class="menu-items">
				<ng-container *ngFor="let item of version.children">
					<li ngxVersionMenu *ngIf="!item.hidden"
						[menuItem]="item"
						[class.menu-group]="item.group"
						class="menu-item">
					</li>
				</ng-container>
			</ul>
		</span>
  `,
})
export class NgxChangeLogMenuComponent extends NbMenuComponent
{
	// public tag: string = 'sidebar-menu';

	@Input()
	items: IVersionLog[];
}

@Component({
	selector: 'ngx-changelog-dialog',
	templateUrl: 'changelog-dialog.component.html',
	styles: [
		`
			nb-card-body {
				max-height: 40rem;
				overflow: scroll;
			}
		`,
	],
	// templateUrl: 'dialogue-dialog.component.html',
})
export class ChangelogDialogComponent implements OnInit, IDialog
{
	public appName: string = environment.title;
	public appVersion: string = environment.appVersion;

	public versions: BehaviorSubject<IVersionLog[]> = new BehaviorSubject([]);

	constructor(
		protected ref: NbDialogRef<ChangelogDialogComponent>,
		private http: HttpClient,
	)
	{
	}

	public ngOnInit()
	{
		this.http.get<IVersionLog[]>('assets/data/changelog.json').subscribe((newVersion) => this.versions.next(newVersion));
	}

	public openComplete()
	{
		window.open('https://drive.google.com/open?id=1DLrzoVaJdXJ_XQMhCacIFfXD8UdMQijk', '_blank');
		this.ref.close();
	}

	public dismiss()
	{
		this.ref.close();
	}
}
