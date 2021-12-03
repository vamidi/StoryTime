import { AfterViewInit, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { ChangeProjectSettingsComponent } from '@app-theme/components/firebase-table/change-project-settings/change-project-settings.component';
import { InsertProjectComponent } from '@app-theme/components/firebase-table/insert-project/insert-project.component';
import { InsertTableComponent } from '@app-theme/components/firebase-table/insert-table/insert-table.component';
import { BehaviourType } from '@app-core/types';
import { NbDialogService } from '@nebular/theme';
import { User, UserModel, defaultUser } from '@app-core/data/state/users';
import { UserService } from '@app-core/data/state/users';
import { ProjectsComponent } from '@app-dashboard/projects/projects.component';
import { ProjectComponent } from '@app-dashboard/projects/project/project.component';

import { BehaviorSubject, Subscription } from 'rxjs';
import { UserPreferences } from '@app-core/utils/utils.service';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';

import isEqual from 'lodash.isequal';

@Component({
	selector: 'ngx-sub-header',
	styleUrls: ['./sub-header.component.scss'],
	templateUrl: './sub-header.component.html',
})
export class SubHeaderComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy
{
	@Input()
	public projectsComponent: ProjectsComponent = null

	@Input()
	public projectComponent: ProjectComponent = null;

	public get isAdmin() {
		return this.userService.isAdmin;
	}

	public title: string = 'Projects';
	public addTitle: string = 'Add Project';

	public gridMode: boolean = true;

	// Main subscription to all events
	protected mainSubscription: Subscription = new Subscription();

	protected user: UserModel = defaultUser;

	protected userPreferences: UserPreferences = null;

	constructor(
		protected dialogService: NbDialogService,
		protected userService: UserService,
		protected userPreferencesService: UserPreferencesService)
	{
	}

	public ngOnInit(): void
	{
		this.mainSubscription.add(this.userService.getUser().subscribe((user: User) =>
		{
			// Only push changed users.
			if(!isEqual(this.user, user))
			{
				this.user = user;
			}
		}));

		this.mainSubscription.add(
			this.userPreferencesService.getUserPreferences().subscribe((userPreferences: UserPreferences) =>
		{
			this.userPreferences = { ...userPreferences };

			if(	// if we don't have have grid modes at all we continue or we don't have projects inside grid modes
				!this.userPreferences.hasOwnProperty('gridModes') || !this.userPreferences.gridModes.hasOwnProperty('projects')
			)
			{
				this.userPreferences['gridModes'] = {
					...this.userPreferences.gridModes,
					projects: true,
				};
			}

			if(
				// if we don't have have grid modes at all we continue or we don't have projects inside grid modes
				!this.userPreferences.hasOwnProperty('gridModes') || !this.userPreferences.gridModes.hasOwnProperty('tables')
			)
			{
				this.userPreferences['gridModes'] = {
					...this.userPreferences.gridModes,
					tables: true,
				};
			}

			if(this.projectsComponent)
			{
				this.toggleViewMode(this.userPreferences.gridModes.projects);
			}
			else if(this.projectComponent)
			{
				this.toggleViewMode(this.userPreferences.gridModes.tables);
			}
		}));
	}

	public ngAfterViewInit(): void
	{
	}

	public ngOnChanges(changes: SimpleChanges)
	{
		if(changes.hasOwnProperty('projectsComponent') && changes.projectsComponent.currentValue)
		{
			this.title = 'Projects';
			this.addTitle = 'Add Project';
			this.projectComponent = null;

			if(this.userPreferences)
				this.toggleViewMode(this.userPreferences.gridModes.projects);
		}

		if(changes.hasOwnProperty('projectComponent') && changes.projectComponent.currentValue)
		{
			this.title = 'Tables';
			this.addTitle = 'Add Table';
			this.projectsComponent = null;

			if(this.userPreferences)
				this.toggleViewMode(this.userPreferences.gridModes.tables);
		}
	}

	public ngOnDestroy()
	{
		if(!this.mainSubscription.closed)
			this.mainSubscription.unsubscribe();
	}

	public insertProject()
	{
		if(this.projectsComponent)
		{
			/* const ref = */
			this.dialogService.open(InsertProjectComponent, {
				context: {
					user: this.user,
					behaviourType$: new BehaviorSubject(BehaviourType.INSERT),
				},
			});
		}

		if(this.projectComponent)
		{
			this.dialogService.open(InsertTableComponent, {
				context: {
					title: 'Insert New Table',
					tableItems: Object.keys(this.projectComponent.getProject.tables),
					project: this.projectComponent.getProject,
					user: this.user,
					behaviourType$: new BehaviorSubject<BehaviourType>(BehaviourType.INSERT),
				},
			})
		}
	}

	public toggleViewMode(gridMode: boolean)
	{
		this.gridMode = gridMode !== undefined ? gridMode : true;

		if(this.projectsComponent)
		{
			this.projectsComponent.toggleView.emit(this.gridMode);

			if(this.userPreferences.gridModes.projects !== this.gridMode)
			{
				this.userPreferences.gridModes.projects = this.gridMode;
				this.userPreferencesService.setUserPreferences(this.userPreferences);
			}

		}

		if(this.projectComponent)
		{
			this.projectComponent.toggleView.emit(this.gridMode);

			if(this.userPreferences.gridModes.tables !== this.gridMode)
			{
				this.userPreferences.gridModes.tables = this.gridMode;
				this.userPreferencesService.setUserPreferences(this.userPreferences);
			}
		}
	}

	public openSettings()
	{
		if(this.projectComponent)
		{
			this.dialogService.open(ChangeProjectSettingsComponent, {
				context: {
					project: this.projectComponent.getProject,
					user: this.user,
				},
				closeOnEsc: false,
			});
		}
	}
}
