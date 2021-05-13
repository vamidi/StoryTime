import { AfterViewInit, Component, ComponentRef, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { SmartTableData } from '@app-core/data/smart-table';
import { QuestsSmartTableService } from '@app-core/mock/quests-smart-table.service';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { AssociatedRelation, FirebaseRelationService, TableRelation } from '@app-core/utils/firebase/firebase-relation.service';
import { NbDialogService, NbGlobalLogicalPosition, NbToastrService } from '@nebular/theme';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { UtilsService } from '@app-core/utils';
import { Location } from '@angular/common';
import { FirebaseTableFunctionalityComponent } from '@app-core/components/firebase/firebase-table-functionality.component';

import { InsertColumnComponent } from '@app-theme/components/firebase-table/insert-column/insert-column.component';
import { ChangeTableSettingsComponent } from '@app-theme/components/firebase-table/change-table-settings/change-table-settings.component';
import { firebaseFilterConfig } from '@app-core/providers/firebase-filter.config';
import { DynamicComponentService } from '@app-core/utils/dynamic-component.service';
import { TableOverviewEventsComponent } from './table-overview-events.component';
import { UserData, UserService } from '@app-core/data/state/users';
import { Table } from '@app-core/data/state/tables';
import { LanguageService, ProjectsService } from '@app-core/data/state/projects';
import { TablesService } from '@app-core/data/state/tables';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';

@Component({
	selector: 'ngx-table-overview',
	templateUrl: './firebase-table-overview.component.html',
	styleUrls: ['../../../../../../_theme/components/base-table-layout/base-table-layout.component.scss'],
	providers: [
		{ provide: SmartTableData, useClass: QuestsSmartTableService},
	],
})
export class TableOverviewComponent extends FirebaseTableFunctionalityComponent implements OnInit, AfterViewInit
{
	@ViewChild('insertColumnComponent', {static: false})
	public insertColumnComponent: InsertColumnComponent = null;

	@ViewChild('changeTableSettings', {static: false})
	public changeTableSettings: ChangeTableSettingsComponent = null;

	@ViewChild('smartTableComponent', { static: false })
	public smartTableComponent: any = null;

	public tblName = 'taskEvents';

	public ids: number[] = [ Number.MAX_SAFE_INTEGER ];

	public currentState: any = null;

	@ViewChild('overViewContainer', { read: ViewContainerRef, static: false })
	public overViewContainer;

	protected tableRelationData: TableRelation = null;

	public constructor(
		public firebaseService: FirebaseService,
		protected firebaseRelationService: FirebaseRelationService,
		protected service: SmartTableData,
		protected userService: UserService,
		protected userPreferenceService: UserPreferencesService,
		protected projectService: ProjectsService,
		protected tableService: TablesService,
		protected toastrService: NbToastrService,
		protected nbToastrService: NbToastrService,
		protected nbSnackbarService: NbSnackbarService,
		protected router: Router,
		protected dialogService: NbDialogService,
		protected languageService: LanguageService,
		protected location: Location,
		protected activatedRoute: ActivatedRoute,
		protected dynamicComponentService: DynamicComponentService,
	)
	{
		super(firebaseService, firebaseRelationService,
			service, userService, userPreferenceService, projectService, tableService, toastrService,
			nbSnackbarService, languageService, router, dialogService,
		);
	}

	public ngOnInit(): void
	{
		this.currentState = this.location.getState();

		// Get the quests table
		// this.tableName = 'quests';
		// Let firebase search with current table name
		// this.firebaseService.setTblName(this.tableName);

		if(!this.currentState.hasOwnProperty('id'))
		{

			const url = this.router.url.split( '/' );
			this.tableName = url[ url.length - 2 ];

			this.tableRelationData = this.firebaseRelationService.getTableRelationData().get(this.tableName);

			if(!this.tableRelationData)
				console.error('No data found for this query!');

			// this.setTblName = this.tableRelationData.tableName;
			this.setTblName = this.tableRelationData.associatedTable.key;

			// Main loader --> Dialogues --> Dialogues
			// Main loader --> Quests --> Tasks
			// Associated table --> Dialogues -> Stories
			// Associated table --> Quests --> Quests

			// this.tableName = this.tableName === 'dialogues' ? this.tableName : 'tasks';

			// this.firebaseService.setTblName(tableData.tableName);

			const that = this;
			const map: ParamMap = this.activatedRoute.snapshot.paramMap;

			this.currentState['id'] = Number.MAX_SAFE_INTEGER;
			const title = UtilsService.titleCase(UtilsService.replaceCharacter(map.get('name'), /-/g, ' '));
			this.firebaseService
				.getRef(this.tableRelationData.tableName)
					// this.tableName === 'dialogues' ? 'stories' : 'quests')
				.orderByChild('title')
				.equalTo(title).on('value', (snapshots) =>
			{
				if(!snapshots.hasChildren())
				{
					UtilsService.showToast(
						this.nbToastrService,
						'Table item not found',
						'Item couldn\'t be found!',
						'danger',
						3500,
						NbGlobalLogicalPosition.TOP_END,
					);

					UtilsService.onError('Item couldn\'t be found');

					// retrieve the data after finding the quest
					// that.getTableData(this.settings);
				}
				else
				{
					snapshots.forEach(function (snapshot)
					{
						if (snapshot.exists())
						{
							const q: any = snapshot.exists ? snapshot.val() : {};

							that.currentState =
							{
								...that.currentState,
							};

							that.tableRelationData.associatedTable.value.forEach(value => {
								if(value === 'id')
									that.currentState['id'] = +snapshot.key;
								else
									that.currentState[value] = +q[value];
							});
						}
					});

					//
					this.loadFilters();

					this.changeTitle();

					// retrieve the data after finding the story
					this.getTableData(this.settings);
				}
			});

			// 	this.router.navigate(['../../../'], { relativeTo: this.activatedRoute }).then();
		} else
		{
			this.tableName = this.currentState.table;

			this.tableRelationData = this.firebaseRelationService.getTableRelationData().get(this.tableName);

			if(!this.tableRelationData)
				console.error('No data found for this query!');

			// this.setTblName = this.tableRelationData.tableName;
			this.setTblName = this.tableRelationData.associatedTable.key;

			// this.tableName = this.tableName === 'dialogues' ? this.tableName : 'tasks';
			// this.firebaseService.setTblName(this.tableName);

			this.loadFilters();

			this.changeTitle();

			this.getTableData(this.settings);
		}
	}

	public ngAfterViewInit(): void
	{
		this.dynamicComponentService.setRootViewContainerRef(this.overViewContainer);
	}

	public isTable()
	{
		// if the table name is empty false --> true
		return this.tableName !== 'game-db';
	}

	public stateLoaded()
	{
		return this.currentState.id !== Number.MAX_SAFE_INTEGER;
	}

	protected loadFilters()
	{
		const tblParentIdFilterFunc = (item: any) =>
			item.parentId === this.currentState.id || item.parentId === Number.MAX_SAFE_INTEGER;
		const colNextIdFilterFunc = (item: any) =>
			item.parentId === this.currentState.id || item.parentId === Number.MAX_SAFE_INTEGER;
		const colParentIdFilterFunc = (item: any) => item.id === this.currentState.id;

		//
		firebaseFilterConfig.tableFilters.push(
			{
				table: 'tasks', column: 'parentId', filter: tblParentIdFilterFunc,
			},
			{
				table: 'dialogues', column: 'parentId', filter: tblParentIdFilterFunc,
			});

		firebaseFilterConfig.columnFilters.push(
			{
				table: 'tasks', columns: ['nextId'], filter: colNextIdFilterFunc,

			},
			{
				table: 'tasks', columns: ['parentId'], filter: colParentIdFilterFunc,
			},
			{
				// table: 'dialogues', columns: ['nextId'], filter: colNextIdFilterFunc,
			},
			{
				// table: 'dialogues', columns: ['parentId'], filter: colParentIdFilterFunc,
			},
		);
	}

	/**
	 * @override
	 * @brief - Change the title of the table
	 */
	protected changeTitle()
	{
		super.changeTitle();

		const map: ParamMap = this.activatedRoute.snapshot.paramMap;

		let title;
		if (this.currentState.hasOwnProperty('title'))
			title = UtilsService.titleCase(UtilsService.replaceCharacter(this.currentState.title, /-/g, ' '));
		else
			title = UtilsService.titleCase(map.get('name'));

		this.AddTitle = title;
	}

	protected loadAssociatedTables()
	{
		if(!this.tableRelationData)
			return;

		// if this table is dialogues we need different events
		// this.tblName = isDialoguesTbl ? 'dialogueEvents' : this.tblName;
		this.tableRelationData.associated.forEach((table: AssociatedRelation) => {
			const ref: ComponentRef<TableOverviewEventsComponent> =
				this.dynamicComponentService.addDynamicComponent(TableOverviewEventsComponent)

			ref.instance.tblName = table.key;
			ref.instance.ids = this.ids;
			ref.changeDetectorRef.detectChanges();
		});
	}

	protected async onDataReceived(tableData: Table)
	{
		await super.onDataReceived(tableData);
		// if(tableData.data.length !== 0)
		{
			this.ids.push(...this.filteredData.map(({ id }) => Number(id)));
			// tableData.data = tableData.data.filter(item.filter);

			/*
			let currentTask = null;
			for (let i = 0; i < tableData.data.length; i++) {
				const data = tableData.data[i];
				if (this.currentState.childId === data.id) {
					currentTask = data;
					this.tasks.push(data);
					break;
				}
			}

			while (currentTask) {
				if (currentTask.nextId !== Number.MAX_SAFE_INTEGER) {
					const next = tableData.data.find(data => data.id === currentTask.nextId);
					if (next) {
						currentTask = next;
						this.tasks.push(currentTask);
					} else
						currentTask = null;
				} else
					currentTask = null;
			}
			*/
		}

		this.loadAssociatedTables();
		// this.breadcrumbService.addFriendlyNameForRouteRegex('/pages/game-db/quests/[a-zA-Z]', this.title);
	}
}
