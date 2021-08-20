import { Component, OnDestroy, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { NbDialogService, NbMenuItem, NbMenuService, NbToastrService } from '@nebular/theme';
import { LanguageService, Project } from '@app-core/data/state/projects';
import { BaseSourceDataComponent } from '@app-core/components/firebase/base-source-data.component';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { BehaviourType } from '@app-core/types';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { InsertTableComponent } from '@app-theme/components/firebase-table';
import { UserData, UserService } from '@app-core/data/state/users';
import { ProjectsService } from '@app-core/data/state/projects';
import { BreadcrumbsService, UtilsService } from '@app-core/utils';

import { Table } from '@app-core/data/state/tables';
import { BehaviorSubject } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { TablesService } from '@app-core/data/state/tables';
import { LocalDataSource } from '@vamidicreations/ng2-smart-table';
import { BaseSettings } from '@app-core/mock/base-settings';
import { LinkRenderComponent } from '@app-theme/components';

import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { environment } from '../../../../environments/environment';
import { User } from '@app-core/data/state/users';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';
import isEqual from 'lodash.isequal';

@Component({
	selector: 'ngx-project',
	templateUrl: 'project.component.html',
})
export class ProjectComponent extends BaseSourceDataComponent implements OnInit, OnDestroy
{
	public tableData: Table[] = [];

	public source: LocalDataSource = new LocalDataSource();

	public cardOptions: Map<number | string, NbMenuItem[]> = new Map<number | string, NbMenuItem[]>();

	public get getProject()
	{
		return this.project;
	}

	protected project: Project = new Project();

	protected userProjects: Map<string, string> = new Map<string, string>();

	protected currentState: { project: Project } = { project: new Project() };

	private readonly indexColumnPrefName = UtilsService.titleLowerCase(environment.title + ' project');

	constructor(
		public tablesService: TablesService,
		protected toasterService: NbToastrService,
		protected snackbarService: NbSnackbarService,
		protected menuService: NbMenuService,
		protected userService: UserService,
		protected userPreferencesService: UserPreferencesService,
		protected projectsService: ProjectsService,
		protected firebaseService: FirebaseService,
		protected firebaseRelationService: FirebaseRelationService,
		protected breadcrumbService: BreadcrumbsService,
		protected languageService: LanguageService,
		protected router: Router,
		protected activatedRoute: ActivatedRoute,
		protected dialogService: NbDialogService,
		private location: Location,
	) {
		super(
			router, toasterService, snackbarService, userService, userPreferencesService,
			projectsService, tablesService, firebaseService, firebaseRelationService, languageService, 'projects',
		);
	}

	public ngOnInit(): void
	{
		super.ngOnInit();

		this.mainSubscription.add(this.user$.pipe(
			switchMap((user) => {
				if(user)
				{
					this.getProjectInformation().then(() => this.generateBreadcrumbs());
				}
				return this.projectsService.getProject$()
			}),
		).subscribe((project) =>
		{
			if(project && !isEqual(this.project, project) && project.hasOwnProperty('tables'))
			{
				this.project = project;
				this.getTables();
			}

			this.userService.setUserPermissions(this.projectsService);
			this.generateBreadcrumbs();
		}));

		this.mainSubscription.add(this.toggleView.subscribe((gridMode: boolean) => this.gridMode = gridMode));

		this.currentState = <{ project: Project }>this.location.getState();

		if(!this.currentState.hasOwnProperty('project'))
		{
			this.currentState = { ...this.currentState, project: new Project() };
			const that = this;
			const map: ParamMap = this.activatedRoute.snapshot.paramMap;
			const id = map.get('id');

			console.log(id);
			this.firebaseService.getRef('projects/' + id).on('value', (snapshots) =>
			{
				that.currentState.project.id = id;
				snapshots.forEach(function(snapshot)
				{
					if(snapshot.exists())
					{
						// const q: any = snapshot.exists ? snapshot.val() : {};
						that.currentState['project'][snapshot.key] = snapshot.val();
					}
				});

				// set this project to the current
				this.project = this.projectsService.setProject(id, that.currentState.project, true);
				this.getTables();
			}, () => this.router.navigateByUrl('/dashboard/error'));

			// 	this.router.navigate(['../../../'], { relativeTo: this.activatedRoute }).then();
		}

		// Add subscription to the list of subscriptions
		this.mainSubscription.add(this.menuService.onItemClick()
			.pipe(
				filter(({ tag }) => tag === 'open-table-menu'),
			).subscribe(({ item: { title, data } }) => this.onCardOptionClicked({ title, data })));
	}

	public ngOnDestroy()
	{
		super.ngOnDestroy();

		// unsubscribe
		for(const key of Object.keys(this.project.tables))
		{
			this.firebaseService.getRef('tables').child(key).off('value');
		}
	}

	public getTitle(str: string)
	{
		return UtilsService.title(str);
	}

	public insertTable(behaviourType: BehaviourType = BehaviourType.INSERT): void
	{
		this.onCardOptionClicked({
				title: behaviourType === BehaviourType.INSERT ? 'insert' : behaviourType === BehaviourType.UPDATE ? 'edit' : 'delete',
			},
		);
	}

	public onTableClicked(event:any, table: Table)
	{
		if(
			// if the first level is equal to the card
			event.target.parentElement && event.target.parentElement === event.currentTarget ||
			// or the second level
			event.target.parentElement && event.target.parentElement.parentElement &&
			event.target.parentElement.parentElement === event.currentTarget
		)
		{
			this.router.navigate(['./tables/', table.id], { relativeTo: this.activatedRoute }).then();
		}
	}

	public getCardOption(id: string): NbMenuItem[]
	{
		if(!this.cardOptions.has(id))
		{
			const menu: NbMenuItem[] = [{ title: 'Edit', data: { id: id } }, { title: 'Delete', data: { id: id } }];
			this.cardOptions.set(id, menu);
		}

		return this.cardOptions.get(id);
	}

	public onCardOptionClicked(item: any)
	{
		switch(item.title.toLowerCase())
		{
			case 'insert':
				this.dialogService.open(InsertTableComponent, {
					context: {
						title: 'Insert New Table',
						tableItems: Object.keys(this.currentState.project.tables),
						project: this.project,
						user: this.user,
						behaviourType$: new BehaviorSubject<BehaviourType>(BehaviourType.INSERT),
					},
				})
				break;
			case 'edit':
				/* const ref = */ this.dialogService.open(InsertTableComponent, {
					context: {
						title: 'Insert New Table',
						tableItems: Object.keys(this.currentState.project.tables),
						project: this.project,
						user: this.user,
						table: this.tablesService.getTableById(item.data.id),
						behaviourType$: new BehaviorSubject<BehaviourType>(BehaviourType.UPDATE),
					},
				});
				break;
			case 'delete':
				if (window.confirm('Are you sure you want to delete?'))
				{
					// this.onDeleteConfirm(data)
					this.tablesService.markAsDelete(item.data.id);
				}
				break;
		}
	}

	public openEditor(location: string = '')
	{
		if(!location)
			this.router.navigate(['./editor'], { relativeTo: this.activatedRoute }).then();
		else
			this.router.navigate([`./editor/${location}`], { relativeTo: this.activatedRoute}).then();
	}

	protected configureSettings()
	{
		const newSettings: BaseSettings = { ...this.settings };

		newSettings.actions = {
			add: false,
			edit: true,
			delete: true,
			position: 'right',
			width: '100px',
			custom: [],
		};

		newSettings.columns['title'] = {
			title: 'Title',
			type: 'custom',
			editable: true,
			addable: false,
			hidden: false,
			renderComponent: LinkRenderComponent,
			onComponentInitFunction: (instance: LinkRenderComponent) => {
				// firebase, tableName, value => id
				instance.url = './tables';
			},
		};

		newSettings.columns['description'] = {
			title: 'Description',
			type: 'string',
			editable: true,
			addable: false,
			hidden: false,
		}

		// Reorder the columns based on the localstorage if we have them.
		this.processColumnData(newSettings, this.indexColumnPrefName);

		this.settings = Object.assign({}, newSettings);
	}

	public onColumnOrderChange(event: any)
	{
		if(event.hasOwnProperty('columns'))
		{
			const container = this.userPreferences.indexColumns;

			if(!container.has(this.indexColumnPrefName))
				container.set(this.indexColumnPrefName, {});

			for(const key of Object.keys(event.columns))
			{
				container.get(this.indexColumnPrefName)[key] = event.columns[key].index;
			}

			this.userPreferencesService.setUserPreferences(this.userPreferences);
		}
	}

	protected getTables()
	{
		this.configureSettings();

		// only show title & description
		const data: { id: string, title: string, deleted: boolean }[] = [];
		for(const key of Object.keys(this.project.tables))
		{
			const t: { enabled: boolean, name: string, description?: string } = this.project.tables[key];

			if(!this.tablesService.getTableById(key))
			{
				const table = new Table();

				table.id = key;
				table.metadata.title = t.name;
				table.metadata.description = t.description;
				table.metadata.deleted = !t.enabled;

				this.tablesService.setTable(table.id, table);
			}
			data.push({id: key, title: t.name, deleted: t.enabled });
		}

		// filter alphabetically
		data.sort((a, b) => a.title.localeCompare(b.title));
		this.source.load(data).then(() => this.source.refresh());

		// this.projectsService.loadTables(this.project, () => {
		// 	this.zone.run(() =>
		// 	{
		// 		console.log('zone Run');
		// 		this.source.load(this.tablesService.getSource([
		// 			'id', 'title', 'description', 'deleted', 'created_at', 'updated_at',
		// 		])).then(() => this.source.refresh());
		// 	});
		// });
	}

	protected getProjectInformation(): Promise<void>
	{
		if(!this.user)
			return;

		const promises: Promise<void>[] = [];
		const projects = Object.keys(this.user.projects);
		for (const key of projects)
		{
			if(!this.userProjects.has(key))
			{
				if(this.project.id === key)
					this.userProjects.set(key, this.project.metadata.title);
				else
					promises.push(new Promise((resolve, _) =>
					{
						this.firebaseService.getRef(`projects/${key}/metadata/title`).on('value', (snapshot) =>
						{
							this.userProjects.set(key, snapshot.val());
							resolve();
						})
					}));
			}
		}

		return new Promise((resolve) =>
		{
			Promise.all(promises).then(() => resolve());
		});
	}

	protected onUserReceived(user: User)
	{
		super.onUserReceived(user);
	}

	private generateBreadcrumbs()
	{
		if(this.userProjects.size === 0)
			return;

		// TODO hide projects that the user is not allowed to see.
		this.breadcrumbService.addDropdownForRoute('/dashboard/projects',
			Array.from( this.userProjects ).map<NbMenuItem>(([t, v]) => {
				return {title: v, data: {method: 'projects', id: t}}
			}));
		this.breadcrumbService.regenerateBreadcrumbTrail();
	}
}
