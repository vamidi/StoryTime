import { AfterViewInit, Component, ElementRef, Input, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { NbMenuService, NbSidebarService } from '@nebular/theme';
import { LayoutService } from '@app-core/utils';
import { ProjectsComponent } from '@app-dashboard/projects/projects.component';
import { ProjectComponent } from '@app-dashboard/projects/project/project.component';
import { NgxMenuItem } from '@app-theme/components';

@Component({
	selector: 'ngx-one-column-layout',
	styleUrls: ['./one-column.layout.scss'],
	template: `
		<nb-layout windowMode>
			<nb-layout-header subheader>
				<ngx-header></ngx-header>
			</nb-layout-header>

			<nb-layout-header subheader *ngIf="projectsComponent || projectComponent" class="nb-layout-sub-header">
				<ngx-sub-header [projectsComponent]="projectsComponent" [projectComponent]="projectComponent"></ngx-sub-header>
			</nb-layout-header>

			<nb-sidebar class="menu-sidebar" tag="menu-sidebar" responsive>
				<div class="header-container">
					<div class="logo-container">
						<a href="#" class="sidebar-toggle" (click)="toggleSidebar()">
							<nb-icon icon="menu-2-outline"></nb-icon>
						</a>
						<a class="logo" href="#" (click)="navigateHome()">{{ title }}</a>
					</div>
				</div>
				<ng-content select="ngx-menu"></ng-content>
			</nb-sidebar>

			<nb-layout-column class="position-relative">
				<div class="overlay" #div></div>
				<div id="project-list" class="position-absolute px-3 py-4" #div>
					<nb-icon icon="close-outline" id="close"></nb-icon>
					<div class="d-flex">
						<h6 class="mb-5">Jump to project</h6>
					</div>
					<nb-form-field>
						<nb-icon nbSuffix icon="search-outline"></nb-icon>
						<input nbInput fullWidth type="text" value="" placeholder="Search Project" shape="round"/>
					</nb-form-field>

					<!-- All recent projects -->
					<div class="d-flex flex-row align-items-center project" *ngFor="let i of times;">
						<ngx-avatars name="Pixian Website Redesign" [round]="false" cornerRadius="0" size="20"></ngx-avatars>
						<div>
							<p>Pixian website redesign</p>
							<nb-icon icon="clock-outline"></nb-icon>
							<span> 12 days ago</span>
						</div>
					</div>
				</div>
				<ng-content select="router-outlet"></ng-content>
			</nb-layout-column>

			<nb-layout-footer fixed>
				<ngx-footer></ngx-footer>
			</nb-layout-footer>
		</nb-layout>
	`,
})
export class OneColumnLayoutComponent implements OnInit, AfterViewInit
{
	@Input()
	public menu!: NgxMenuItem[];

	public title: string = '';

	public projectsComponent: ProjectsComponent = null;

	public projectComponent: ProjectComponent = null;

	public times: number[] = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10];

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

	public ngOnInit(): void
	{
	}

	public ngAfterViewInit(): void
	{
		if(this.elements.length)
		{
			this.menu[1].onIconSuffixClick = () => {
				this.toggle = !this.toggle;
				this.elements.forEach((el) => {
					if(this.toggle)
						el.nativeElement.classList.add('open');
					else
						el.nativeElement.classList.remove('open');
				});
			}
		}
	}

	public toggleSidebar(): boolean
	{
		this.sidebarService.toggle(true, 'menu-sidebar');
		this.layoutService.changeLayoutSize();

		return false;
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

	public navigateHome(): boolean
	{
		this.menuService.navigateHome();
		return false;
	}
}
