import { Component, ElementRef, Input, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { NbMenuService, NbSidebarService } from '@nebular/theme';
import { LayoutService } from '@app-core/utils';
import { ProjectsComponent } from '@app-dashboard/projects/projects.component';
import { ProjectComponent } from '@app-dashboard/projects/project/project.component';

@Component({
	selector: 'ngx-single-view-layout',
	styleUrls: ['./single-view.layout.scss'],
	template: `
		<nb-layout>
			<nb-layout-header *ngIf="setHeader">
				<ngx-header></ngx-header>
			</nb-layout-header>

			<nb-layout-column class="position-relative">
				<ng-content select="router-outlet"></ng-content>
			</nb-layout-column>
		</nb-layout>
	`,
})
export class SingleViewLayoutComponent
{
	@Input('withHeader')
	public setHeader: boolean = false;

	public title: string = '';

	public projectsComponent: ProjectsComponent = null;

	public projectComponent: ProjectComponent = null;

	@ViewChildren('div')
	public elements: QueryList<ElementRef>;

	@ViewChild('menuContent', { static: false })
	public menuContent = null;

	protected toggle: boolean = false;

	constructor(
		public menuService: NbMenuService,
		public sidebarService: NbSidebarService,
		public layoutService: LayoutService)
	{
		this.title = environment.title;
	}

	public onRouterOutletActivate(event: Component)
	{
		if(event instanceof ProjectsComponent)
			this.projectsComponent = <ProjectsComponent>(event);
		else if(event instanceof ProjectComponent)
			this.projectComponent = <ProjectComponent>(event);
		else
		{
			this.projectsComponent = null;
			this.projectComponent = null;
		}
	}
}
