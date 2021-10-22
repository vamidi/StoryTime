import { AfterContentInit, Component } from '@angular/core';
import { NbTabsetComponent } from '@nebular/theme';

@Component({
	selector: 'nb-vertical-tabset',
	styleUrls: ['./vertical-tabset.component.scss'],
	template: `
		<ul class="vertical-tabset">
			<li *ngFor="let tab of tabs"
			    (click)="selectTab(tab)"
			    (keyup.space)="selectTab(tab)"
			    (keyup.enter)="selectTab(tab)"
			    [class.responsive]="tab.responsive"
			    [class.active]="tab.active"
			    [class.disabled]="tab.disabled"
			    [attr.tabindex]="tab.disabled ? -1 : 0"
			    [attr.data-tab-id]="tab.tabId"
			    class="tab">
				<a href (click)="$event.preventDefault()" tabindex="-1" class="tab-link">
					<nb-icon *ngIf="tab.tabIcon" [config]="tab.tabIcon"></nb-icon>
					<span *ngIf="tab.tabTitle" class="tab-text">{{ tab.tabTitle }}</span>
				</a>
				<nb-badge *ngIf="tab.badgeText || tab.badgeDot"
				          [text]="tab.badgeText"
				          [dotMode]="tab.badgeDot"
				          [status]="tab.badgeStatus"
				          [position]="tab.badgePosition">
				</nb-badge>
			</li>
		</ul>
		<ng-content select="nb-tab"></ng-content>
	`,
})
export class NbVerticalTabSetComponent extends NbTabsetComponent implements AfterContentInit { }
