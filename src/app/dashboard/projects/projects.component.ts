import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { NbDialogService, NbMenuService, NbToastrService } from '@nebular/theme';
import { InsertProjectComponent } from '@app-theme/components/firebase-table/insert-project/insert-project.component';
import { BaseSourceDataComponent } from '@app-core/components/firebase/base-source-data.component';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { User, UserData } from '@app-core/data/state/users';
import { Project } from '@app-core/data/state/projects';
import { ActivatedRoute, Router } from '@angular/router';
import { UtilsService } from '@app-core/utils';
import { UserService } from '@app-core/data/state/users';
import { LanguageService, ProjectsService } from '@app-core/data/state/projects';
import { BehaviourType } from '@app-core/types';
import { LinkRenderComponent } from '@app-theme/components';
import { NbMenuItem } from '@nebular/theme/components/menu/menu.service';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalDataSource } from '@vamidicreations/ng2-smart-table';
import { BaseSettings } from '@app-core/mock/base-settings';
import { TablesService } from '@app-core/data/state/tables';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { environment } from '../../../environments/environment';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';
import { DataSnapshot } from '@angular/fire/database/interfaces';

@Component({
	selector: 'ngx-projects',
	templateUrl: 'projects.component.html',
	styles:[`
		.member {
			margin: 0 0.25rem;
		}

		.member:first-child {
			margin: 0;
		}
	`,
	],
})
export class ProjectsComponent extends BaseSourceDataComponent implements OnInit, OnDestroy
{
	public cardOptions: Map<number | string, NbMenuItem[]> = new Map<number | string, NbMenuItem[]>();

	public source: LocalDataSource = new LocalDataSource();

	protected projectID: string = '';

	// protected loadedProjects: string[] = [];

	private readonly indexColumnPrefName = UtilsService.titleLowerCase(environment.title + ' projects');

	constructor(
		public projectsService: ProjectsService,
		protected toastrService: NbToastrService,
		protected snackbarService: NbSnackbarService,
		protected dialogService: NbDialogService,
		protected menuService: NbMenuService,
		protected userService: UserService,
		protected userPreferenceService: UserPreferencesService,
		protected tableService: TablesService,
		protected firebaseService: FirebaseService,
		protected firebaseRelationService: FirebaseRelationService,
		protected languageService: LanguageService,
		protected activatedRoute: ActivatedRoute,
		protected router: Router,
		protected ngZone: NgZone,
		protected cd: ChangeDetectorRef,
	) {
		super(
			router, toastrService, snackbarService, userService, userPreferenceService,
			projectsService, tableService, firebaseService, firebaseRelationService, languageService, 'projects',
		);
	}

	public ngOnInit(): void
	{
		super.ngOnInit();

		this.projectsService.unset();

		// Add subscription to the list of subscriptions
		this.mainSubscription.add(this.menuService.onItemClick()
			.pipe(
				filter(({ tag }) => tag === 'open-project-menu'),
			).subscribe(({ item: { title, data } }) => this.onCardOptionClicked({ title, data })));

		this.mainSubscription.add(this.toggleView.subscribe((gridMode: boolean) => this.gridMode = gridMode));
	}

	public ngOnDestroy()
	{
		super.ngOnDestroy();

		if(this.user.hasOwnProperty('projects'))
		{
			for (const key of Object.keys(this.user.projects))
			{
				this.firebaseService.getRef('projects').child(key).off('value');
			}
		}
	}

	public insertProject(behaviourType: BehaviourType = BehaviourType.INSERT)
	{
		// Otherwise scope will make this undefined in the method
		// ref.componentRef.instance.insertEvent.subscribe((event: any) => this.onCreateConfirm(event));

		this.onCardOptionClicked({
				title: behaviourType === BehaviourType.INSERT ? 'insert' : behaviourType === BehaviourType.UPDATE ? 'edit' : 'delete',
			},
		);
	}

	public onCardOptionClicked(item: any)
	{
		switch(item.title.toLowerCase())
		{
			case 'insert':
				/* const ref = */ this.dialogService.open(InsertProjectComponent, {
					context: {
						user: this.user,
						behaviourType$: new BehaviorSubject(BehaviourType.INSERT),
					},
				});
				break;
			case 'edit':
				/* const ref = */ this.dialogService.open(InsertProjectComponent, {
					context: {
						user: this.user,
						project: this.projectsService.getProjectById(item.data.id),
						behaviourType$: new BehaviorSubject<BehaviourType>(BehaviourType.UPDATE),
					},
				});
				break;
			case 'delete':
				if (window.confirm('Are you sure you want to delete?'))
				{
					// this.onDeleteConfirm(data)
					this.projectsService.markAsDelete(item.data.id);
				}
				break;
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

	public onProjectClicked(event:any, projectObj: Project)
	{
		// console.log(event.target, event.target.parentElement, event.currentTarget, event.target === event.currentTarget);
		// to prevent propagation
		if(
			// if the first level is equal to the card
			event.target.parentElement && event.target.parentElement === event.currentTarget ||
			// or the second level
			event.target.parentElement && event.target.parentElement.parentElement &&
			event.target.parentElement.parentElement === event.currentTarget
		)
		{
			projectObj = this.projectsService.setProject(projectObj.id, projectObj, true);
			this.userService.setUserPermissions(this.projectService);

			// TODO update the project timestamp locally
			// projectObj.metadata.updated_at = UtilsService.timestamp;
			// this.projectsService.update(projectObj.id).then(() => {
				// clear all the tables if we have one
				this.tableService.clear();
				this.router.navigate(['./', projectObj.id], { relativeTo: this.activatedRoute }).then();
			// });
		}
	}

	public onEditConfirm(event: any)
	{
		this.onCardOptionClicked(
			{ title: 'edit', data: event.data },
		);
	}

	public onDeleteConfirm(event: any)
	{
		this.onCardOptionClicked(
			{ title: 'delete', data: event.data },
		);
	}

	protected onUserReceived(user: User)
	{
		super.onUserReceived(user);

		if(user)
		{
			this.configureSettings();

			if(user.hasOwnProperty('projects'))
			{
				const projects = Object.keys(user.projects);
				this.projectsService.clear(projects);
				for (const key of projects)
				{
					this.projectsService.loadProject(key, (snapshot: DataSnapshot) => {
						this.ngZone.run(() =>
						{
							const payload = snapshot.val();
							const project: Project = { tables: {}, ...payload, id: snapshot.key};
							this.projectsService.setProject(project.id, project);

							this.source.load(this.projectsService.getSource([
								'id', 'title', 'description', 'deleted', 'created_at', 'updated_at',
							])).then(() => this.source.refresh());
							/*
								MENU_ITEMS.forEach((menuItem: NgxMenuItem, index, arr) =>
								{
									if(menuItem.title === 'Projects')
									{
										if(!arr[index].hasOwnProperty('children'))
										{
											arr[index].expanded = true;
											arr[index].children = [];
										}

										if(!menuItem.children.find((child: NgxMenuItem) => child.title === project.metadata.title))
										{
											menuItem.children.push({
												title: project.metadata.title,
												link: '/projects/' + project.id,
												icon: 'chevron-right-outline',
												canFavorite: true,
												isFavorite: false,
												hidden: project.metadata.deleted,
											});

											// this.updateFromList(menuItem, key, tableName, payload.deleted);
										}

										// menuItem.children = UtilsService.sortAlphabetic(menuItem.children, 'title');
									}
								});
							*/
						});
					});
				}
			}
		}
	}

	protected configureSettings()
	{
		const newSettings: BaseSettings = { ...this.settings };

		newSettings.mode = 'external';

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
				instance.url = './';
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
		this.sortColumnData(newSettings, this.indexColumnPrefName);

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

	private updateFromList(root: NbMenuItem, key: string, tableName: string, hidden: boolean) {

		// TODO change if element can have more children
		let index = -1;
		if (root.children.find((child, i) =>
		{
			const b = child.title === tableName;
			index = b ? i : -1;
			return b;
		}))
		{
			root.children[index].hidden = hidden;
			// this.tableItems.forEach((table, i, arr) => { if(table.key === key) arr[i].value = hidden; });
		}
	}
}
